import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Refund queue: open requests by deadline, then recent history. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const { data, error } = await createAdminClient()
    .from('refund_requests')
    .select('id, kind, status, amount, currency, provider, due_at, crypto_address, reason, note, created_at, processed_at, thread_id, members!refund_requests_member_id_fkey (username, email), tickets (events (title))')
    .order('status', { ascending: true })
    .order('due_at', { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ refunds: data ?? [] });
}
