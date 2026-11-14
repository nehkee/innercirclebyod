import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { raffleSchema } from '@/lib/drops-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('raffles')
    .select('id, title, prize_description, status, min_tier, closes_at, drawn_at, winner_id, members (username)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const withCounts = await Promise.all((data ?? []).map(async r => {
    const { count } = await admin.from('raffle_entries').select('id', { count: 'exact', head: true }).eq('raffle_id', r.id);
    return { ...r, entries: count ?? 0 };
  }));
  return NextResponse.json({ raffles: withCounts });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });
  const parsed = raffleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const r = parsed.data;
  const { error } = await createAdminClient().from('raffles').insert({
    title: r.title, description: r.description ?? null, prize_description: r.prizeDescription,
    min_tier: r.minTier ?? null, closes_at: r.closesAt, entries_per_warlord: r.entriesPerVanguard,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath('/access');
  return NextResponse.json({ ok: true }, { status: 201 });
}
