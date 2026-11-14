import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMember, requireAdmin } from '@/lib/auth';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { rateLimit, clientId } from '@/lib/fraud';

const applicationSchema = z.object({
  type:      z.enum(['hangout', 'studio', 'dinner', 'backstage', 'football']),
  userName:  z.string().min(1).max(100),
  userEmail: z.string().email(),
  message:   z.string().min(20).max(1500),
});

function deny(status: 401 | 403) {
  return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`apply:${clientId(req)}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many applications. Try again later.' }, { status: 429 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Applications are not open yet' }, { status: 503 });
  }

  const member = await getCurrentMember();
  const admin  = createAdminClient();

  // One application per type per month (per member when signed in, else per email)
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  let dupe = admin
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('type', parsed.data.type)
    .neq('status', 'rejected')
    .gte('created_at', startOfMonth.toISOString());
  dupe = member ? dupe.eq('member_id', member.id) : dupe.eq('user_email', parsed.data.userEmail.toLowerCase());
  const { count } = await dupe;
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'You already applied for this experience this month' }, { status: 409 });
  }

  const { data, error } = await admin
    .from('applications')
    .insert({
      type:       parsed.data.type,
      member_id:  member?.id ?? null,
      user_name:  parsed.data.userName,
      user_email: parsed.data.userEmail.toLowerCase(),
      message:    parsed.data.message,
    })
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
  return NextResponse.json({ success: true, applicationId: data.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return deny(check.status);

  const status = req.nextUrl.searchParams.get('status');
  let query = createAdminClient()
    .from('applications')
    .select('id, type, user_name, user_email, message, status, created_at, members (username, tier)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status && ['pending', 'approved', 'rejected'].includes(status)) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
  return NextResponse.json({ applications: data ?? [], total: data?.length ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return deny(check.status);

  const body   = await req.json().catch(() => null);
  const parsed = z.object({
    id:     z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
    note:   z.string().max(500).optional(),
  }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from('applications')
    .update({
      status:      parsed.data.status,
      review_note: parsed.data.note ?? null,
      reviewer_id: check.member.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
