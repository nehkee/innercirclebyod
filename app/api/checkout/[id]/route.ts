import { NextRequest, NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { verifyPaystack, verifyStripe } from '@/lib/payments/verify';
import { closePayment, completePayment } from '@/lib/payments/fulfill';
import type { PaymentRow } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

/**
 * Status of one of the signed-in member's payments (polled by the success page).
 * While a card/Paystack payment is pending, this also asks the provider directly,
 * so the purchase completes even if the webhook is slow or not set up yet.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = createAdminClient();
  const load = async () => {
    const { data } = await admin
      .from('payments')
      .select('*, events (id, title)')
      .eq('id', id)
      .eq('member_id', member.id)
      .maybeSingle();
    return data as (PaymentRow & { events: { id: string; title: string } | null }) | null;
  };

  let payment = await load();
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (payment.status === 'pending' && (payment.provider === 'stripe' || payment.provider === 'paystack')) {
    try {
      const v = payment.provider === 'stripe' ? await verifyStripe(payment) : await verifyPaystack(payment);
      if (v.ok) await completePayment(payment.id, v);
      else if (v.final) await closePayment(payment.id, v.final, v.reason);
      payment = (await load()) ?? payment;
    } catch (err) {
      console.error('Payment status check failed', err);
    }
  }

  return NextResponse.json({
    status:   payment.status,
    kind:     payment.kind,
    tier:     payment.tier,
    provider: payment.provider,
    event:    payment.events,
    note:     payment.failure_reason,
  });
}
