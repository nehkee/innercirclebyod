import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { eventSchema, toEventRow } from '@/lib/events-admin';

/** Edit an event, or publish/unpublish it (isActive). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const parsed = eventSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  if (parsed.data.capacity !== undefined) {
    const { data: current } = await admin.from('events').select('sold').eq('id', id).single();
    if (current && parsed.data.capacity < current.sold) {
      return NextResponse.json({ error: `Capacity can't be below tickets already sold (${current.sold}).` }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from('events')
    .update(toEventRow(parsed.data))
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Refresh the public pages that show events
  ['/', '/events', `/events/${id}`].forEach(p => revalidatePath(p));
  return NextResponse.json({ event: data });
}
