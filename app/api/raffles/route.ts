import { NextRequest, NextResponse } from 'next/server';
import { getClerkUserId, requireAdmin } from '@/lib/auth';
import { createAdminClient }         from '@/lib/supabase';
import { rateLimit, clientId, hasMembershipAccess } from '@/lib/fraud';
import { raffleResultEmail }         from '@/lib/email-templates';
import { Resend }                    from 'resend';
import { z }                         from 'zod';

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

// ── Enter a raffle ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit(`raffle-enter:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many raffle entries' }, { status: 429 });
  }

  const body    = await req.json().catch(() => null);
  const schema  = z.object({ raffleId: z.string().uuid() });
  const parsed  = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Load raffle
  const { data: raffle } = await admin
    .from('raffles')
    .select('id, title, status, min_tier, entries_per_warlord, closes_at')
    .eq('id', parsed.data.raffleId)
    .single();

  if (!raffle) {
    return NextResponse.json({ error: 'Raffle not found' }, { status: 404 });
  }
  if (raffle.status !== 'open') {
    return NextResponse.json({ error: 'Raffle is not open' }, { status: 400 });
  }
  if (raffle.closes_at && new Date(raffle.closes_at) < new Date()) {
    return NextResponse.json({ error: 'Raffle has closed' }, { status: 400 });
  }

  // Load member
  const { data: member } = await admin
    .from('members')
    .select('id, tier, email, username')
    .eq('clerk_id', userId)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Tier check
  if (raffle.min_tier) {
    const hasAccess = await hasMembershipAccess(member.id, raffle.min_tier);
    if (!hasAccess) {
      return NextResponse.json({ error: `Requires ${raffle.min_tier} tier` }, { status: 403 });
    }
  }

  // Check duplicate
  const { data: existing } = await admin
    .from('raffle_entries')
    .select('id')
    .eq('raffle_id', raffle.id)
    .eq('user_id', member.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Already entered this raffle' }, { status: 409 });
  }

  // WARLORD+ gets multiple entries
  const TIER_ORDER = ['machine', 'insider', 'warlord', 'industry'];
  const isWarlord  = TIER_ORDER.indexOf(member.tier) >= TIER_ORDER.indexOf('warlord');
  const numEntries = isWarlord ? (raffle.entries_per_warlord ?? 2) : 1;

  const rows = Array.from({ length: numEntries }, () => ({
    raffle_id: raffle.id,
    user_id:   member.id,
  }));

  const { error } = await admin.from('raffle_entries').insert(rows);
  if (error) {
    return NextResponse.json({ error: 'Failed to enter raffle' }, { status: 500 });
  }

  // Award points
  await admin.rpc('update_member_points', { member_id: member.id, points_delta: 25 });

  return NextResponse.json({ success: true, entries: numEntries });
}

// ── Admin: draw a raffle winner ───────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: check.status });
  }
  const admin = createAdminClient();

  const body   = await req.json().catch(() => null);
  const schema = z.object({ raffleId: z.string().uuid() });
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Load all entries
  const { data: entries } = await admin
    .from('raffle_entries')
    .select('id, user_id, members (id, username, email, tier)')
    .eq('raffle_id', parsed.data.raffleId);

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No entries found' }, { status: 400 });
  }

  // Pick random winner
  const winner = entries[Math.floor(Math.random() * entries.length)];
  const wMember = winner.members as any;

  // Update raffle
  const { data: raffle } = await admin
    .from('raffles')
    .update({ status: 'drawn', winner_id: wMember.id, drawn_at: new Date().toISOString() })
    .eq('id', parsed.data.raffleId)
    .select('title, prize_description')
    .single();

  // Email all entrants
  const uniqueUserIds = [...new Set(entries.map((e: any) => e.user_id))];
  const { data: entrantMembers } = await admin
    .from('members')
    .select('id, username, email')
    .in('id', uniqueUserIds as string[]);

  if (entrantMembers && raffle) {
    await Promise.all(
      entrantMembers.map(async (m: any) => {
        if (!m.email) return;
        const won = m.id === wMember.id;
        const { subject, html } = raffleResultEmail({
          memberName:   m.username,
          raffleName:   raffle.title,
          won,
          prizeDetails: won ? raffle.prize_description : undefined,
        });
        return getResend().emails.send({
          from: 'Inner Circle <noreply@innercirclebyod.com>',
          to:   [m.email],
          subject,
          html,
        });
      })
    );
  }

  return NextResponse.json({
    success: true,
    winner:  { id: wMember.id, username: wMember.username },
  });
}

// ── List open raffles ─────────────────────────────────────────────────────────
export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('raffles')
    .select('id, title, description, prize_description, status, min_tier, closes_at, created_at')
    .eq('status', 'open')
    .order('closes_at', { ascending: true });

  return NextResponse.json({ raffles: data ?? [] });
}
