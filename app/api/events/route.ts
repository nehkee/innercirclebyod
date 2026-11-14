import { NextRequest, NextResponse } from 'next/server';
import { eventSchema, toEventRow } from '@/lib/events-admin';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { getEvents } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    const type   = req.nextUrl.searchParams.get('type');
    const events = await getEvents({ includePast: true });
    const filtered = type ? events.filter(e => e.type === type) : events;
    return NextResponse.json({ events: filtered, total: filtered.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: check.status });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from('events')
    .insert({ is_active: true, ...toEventRow(parsed.data) })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
  ['/', '/events'].forEach(p => revalidatePath(p));
  return NextResponse.json({ success: true, event: data }, { status: 201 });
}
