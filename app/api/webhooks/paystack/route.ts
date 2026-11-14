import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient }     from '@/lib/supabase';
import { verifyPaystackWebhook } from '@/lib/fraud';
import { verifyPaystack }        from '@/lib/payments/verify';
import { closePayment, completePayment } from '@/lib/payments/fulfill';
import type { PaymentRow } from '@/lib/payments/types';

/** Paystack webhook (one-time checkouts). Set the URL in Paystack → Settings → API Keys & Webhooks. */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  if (!verifyPaystackWebhook(payload, req.headers.get('x-paystack-signature') ?? '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(payload) as { event: string; data: { reference?: string } };
  const reference = event.data?.reference;
  if (event.event !== 'charge.success' || !reference) return NextResponse.json({ received: true });

  const { data: payment } = await createAdminClient()
    .from('payments')
    .select('*')
    .eq('provider', 'paystack')
    .eq('provider_ref', reference)
    .maybeSingle();
  if (!payment) return NextResponse.json({ received: true });

  // Re-verify with Paystack's API: amount, currency and status
  const v = await verifyPaystack(payment as PaymentRow);
  if (v.ok) await completePayment(payment.id, v);
  else if (v.final) await closePayment(payment.id, v.final, v.reason);

  return NextResponse.json({ received: true });
}
