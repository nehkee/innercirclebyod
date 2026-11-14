import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient }  from '@/lib/supabase';
import { verifyIpnSignature } from '@/lib/payments/nowpayments';
import { verifyCrypto }       from '@/lib/payments/verify';
import { closePayment, completePayment, notePending } from '@/lib/payments/fulfill';
import type { PaymentRow } from '@/lib/payments/types';

/**
 * NOWPayments IPN (crypto). The URL is sent with each invoice; the IPN secret
 * comes from NOWPayments dashboard → Payment Settings.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let body: { payment_id?: number | string; order_id?: string | null };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!verifyIpnSignature(body, req.headers.get('x-nowpayments-sig'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  if (!body.order_id || !body.payment_id || !/^[0-9a-f-]{36}$/i.test(body.order_id)) {
    return NextResponse.json({ received: true });
  }

  const { data: payment } = await createAdminClient()
    .from('payments')
    .select('*')
    .eq('id', body.order_id)
    .eq('provider', 'crypto')
    .maybeSingle();
  if (!payment || payment.status !== 'pending') return NextResponse.json({ received: true });

  // Ask NOWPayments for the authoritative state rather than trusting the callback body
  const v = await verifyCrypto(payment as PaymentRow, body.payment_id);
  if (v.ok)          await completePayment(payment.id, v);
  else if (v.final)  await closePayment(payment.id, v.final, v.reason);
  else               await notePending(payment.id, v.reason);

  return NextResponse.json({ received: true });
}
