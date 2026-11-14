import { NextResponse } from 'next/server';
import { getClerkUserId } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

/**
 * Tickets are issued by the checkout flow (app/api/checkout → lib/payments/fulfill.ts)
 * once the payment is verified. This route lists the signed-in member's tickets.
 */
export async function GET() {
  const userId = getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!member) {
    return NextResponse.json({ tickets: [] });
  }

  const { data: tickets } = await admin
    .from('tickets')
    .select(`
      id, status, payment_status, created_at,
      events (id, title, date, venue, location)
    `)
    .eq('user_id', member.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ tickets: tickets ?? [] });
}
