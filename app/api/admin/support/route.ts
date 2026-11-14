import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Inbox: conversations, waiting-on-team first. */
export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const filter = req.nextUrl.searchParams.get('status') ?? 'active';
  let q = createAdminClient()
    .from('support_threads')
    .select('id, topic, status, reason, outcome, stage, updated_at, created_at, team_last_read_at, members!support_threads_member_id_fkey (username, email, tier), tickets (events (title))')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (filter === 'active') q = q.in('status', ['waiting_team', 'open']);
  else if (filter !== 'all') q = q.eq('status', filter);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count: waiting } = await createAdminClient()
    .from('support_threads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'waiting_team');

  return NextResponse.json({ threads: data ?? [], waiting: waiting ?? 0 });
}
