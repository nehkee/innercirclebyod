import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
  minTier:     z.enum(['machine', 'insider', 'warlord', 'industry']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // TODO: Replace with real Supabase query
    // const { data, error } = await supabase
    //   .from('events')
    //   .select('*')
    //   .order('date', { ascending: true })
    //   .filter(type ? { type } : {});

    return NextResponse.json({ events: [], total: 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // TODO: Admin auth check
    // const { userId } = auth();
    // if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // TODO: Supabase insert
    // const { data, error } = await supabase.from('events').insert(parsed.data).select().single();

    return NextResponse.json({ success: true, event: { id: 'new-id', ...parsed.data } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
