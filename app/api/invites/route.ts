import { NextRequest, NextResponse } from 'next/server';
import { getClerkUserId }            from '@/lib/auth';
import { createAdminClient }         from '@/lib/supabase';
import { generateInviteCode }        from '@/lib/qr';
import { rateLimit }                 from '@/lib/fraud';
import { z }                         from 'zod';

// ── Generate invite code (WARLORD+ only) ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from('members')
    .select('id, tier')
    .eq('clerk_id', userId)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const TIER_ORDER = ['machine', 'insider', 'warlord', 'industry'];
  if (TIER_ORDER.indexOf(member.tier) < TIER_ORDER.indexOf('warlord')) {
    return NextResponse.json(
      { error: 'Invite generation requires WARLORD tier or higher' },
      { status: 403 }
    );
  }

  // Rate limit: 2 invites per month per member
  const rl = await rateLimit(`invites:${member.id}`, 2, 30 * 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Monthly invite limit reached' }, { status: 429 });
  }

  // Count existing unused invites
  const { count } = await admin
    .from('invite_codes')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', member.id)
    .eq('used', false);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'You have 3 pending unused invites' }, { status: 400 });
  }

  const body   = await req.json().catch(() => ({}));
  const schema = z.object({ note: z.string().max(100).optional() });
  const parsed = schema.safeParse(body);

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await admin
    .from('invite_codes')
    .insert({
      code,
      created_by: member.id,
      note:       parsed.success ? parsed.data.note : null,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }

  return NextResponse.json({
    success:   true,
    code:      invite.code,
    expiresAt: invite.expires_at,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?invite=${invite.code}`,
  });
}

// ── Validate invite code ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ valid: false, reason: 'Missing code' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from('invite_codes')
    .select('code, used, expires_at')
    .eq('code', code.toUpperCase())
    .single();

  if (!invite) {
    return NextResponse.json({ valid: false, reason: 'Code not found' });
  }
  if (invite.used) {
    return NextResponse.json({ valid: false, reason: 'Code already used' });
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'Code expired' });
  }

  return NextResponse.json({ valid: true });
}

// ── Redeem invite code (called by the signed-in new member after sign-up) ─────
export async function PATCH(req: NextRequest) {
  const userId = getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = z.object({ code: z.string().min(1).max(32) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('clerk_id', userId)
    .single();
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // One redemption per member
  const { count: alreadyRedeemed } = await admin
    .from('invite_codes')
    .select('id', { count: 'exact', head: true })
    .eq('used_by', member.id);
  if ((alreadyRedeemed ?? 0) > 0) {
    return NextResponse.json({ error: 'You have already redeemed an invite' }, { status: 409 });
  }

  const { data: invite } = await admin
    .from('invite_codes')
    .select('id, used, expires_at, created_by')
    .eq('code', parsed.data.code.toUpperCase())
    .single();

  if (!invite || invite.used) {
    return NextResponse.json({ error: 'Invalid or used code' }, { status: 400 });
  }
  if (invite.created_by === member.id) {
    return NextResponse.json({ error: 'You cannot redeem your own invite' }, { status: 400 });
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code expired' }, { status: 400 });
  }

  // Conditional update so two simultaneous redemptions can't both succeed
  const { data: claimed } = await admin
    .from('invite_codes')
    .update({ used: true, used_by: member.id, used_at: new Date().toISOString() })
    .eq('id', invite.id)
    .eq('used', false)
    .select('id');

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: 'Invalid or used code' }, { status: 400 });
  }

  // Award points to the inviter
  await admin.rpc('update_member_points', {
    member_id:    invite.created_by,
    points_delta: 500,
  });

  return NextResponse.json({ success: true });
}
