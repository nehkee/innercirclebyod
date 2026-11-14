import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { getEvents } from '@/lib/data';

const eventSchema = z.object({
  title:       z.string().min(1).max(200),
  type:        z.enum(['listening_party', 'show', 'hangout', 'studio', 'industry', 'secret']),
  date:        z.string().datetime(),
  location:    z.string().min(1),
  venue:       z.string().optional(),
  description: z.string().min(1).max(2000),
  priceUSD:    z.number().min(0),
  priceNGN:    z.number().min(0),
  capacity:    z.number().int().min(1),
  isVip:       z.boolean().optional(),
  isSecret:    z.boolean().optional(),
  minTier:     z.enum(['initiate', 'insider', 'vanguard', 'sovereign']).optional(),
});

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

  const e = parsed.data;
  const { data, error } = await createAdminClient()
    .from('events')
    .insert({
      title:       e.title,
      type:        e.type,
      date:        e.date,
      location:    e.location,
      venue:       e.venue ?? null,
      description: e.description,
      price_usd:   e.priceUSD,
      price_ngn:   e.priceNGN,
      capacity:    e.capacity,
      is_vip:      e.isVip ?? false,
      is_secret:   e.isSecret ?? false,
      min_tier:    e.minTier ?? null,
      is_active:   true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
  return NextResponse.json({ success: true, event: data }, { status: 201 });
}
