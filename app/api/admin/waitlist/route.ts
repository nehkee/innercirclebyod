import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Waitlist, newest first, with invite status. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });
  const { data, error } = await createAdminClient()
    .from('waitlist')
    .select('id, name, email, source, converted, invited_at, invite_code, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ waitlist: data ?? [] });
}
