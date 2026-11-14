import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { normalisePhone, whatsappEnabled } from '@/lib/notify/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await createAdminClient().from('members').select('phone, whatsapp_opt_in').eq('id', member.id).single();
  return NextResponse.json({ phone: data?.phone ?? '', optIn: Boolean(data?.whatsapp_opt_in), available: whatsappEnabled() });
}

/** Save the member's WhatsApp number and opt-in choice. */
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z.object({ phone: z.string().max(30), optIn: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const phone = parsed.data.phone.trim() ? normalisePhone(parsed.data.phone) : null;
  if (parsed.data.phone.trim() && !phone) {
    return NextResponse.json({ error: 'Use international format, e.g. +234 801 234 5678' }, { status: 400 });
  }
  if (parsed.data.optIn && !phone) {
    return NextResponse.json({ error: 'Add your number to turn on WhatsApp updates' }, { status: 400 });
  }
  await createAdminClient().from('members').update({ phone, whatsapp_opt_in: parsed.data.optIn }).eq('id', member.id);
  return NextResponse.json({ ok: true, phone });
}
