/**
 * Confirm with each provider that a payment really happened, for the right
 * amount, for this payment row. Webhook bodies and redirects are never trusted
 * on their own.
 */
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { verifyPaystackTransaction } from '@/lib/paystack';
import { getPayment } from '@/lib/payments/nowpayments';
import { minorUnits, type PaymentRow, type Verified } from '@/lib/payments/types';

export function checkStripeSession(session: Stripe.Checkout.Session, payment: PaymentRow): Verified {
  if (session.metadata?.paymentId !== payment.id)               return { ok: false, reason: 'Session is for another payment' };
  if (session.payment_status !== 'paid')                        return { ok: false, reason: 'Payment not completed' };
  if (session.currency !== 'usd')                               return { ok: false, reason: 'Unexpected currency' };
  if ((session.amount_total ?? 0) < minorUnits(payment.amount)) return { ok: false, reason: 'Amount too low' };

  const id = (x: string | { id: string } | null) => (typeof x === 'string' ? x : x?.id);
  return {
    ok: true,
    providerPaymentId:    id(session.payment_intent as string | null) ?? id(session.subscription as string | null),
    stripeCustomerId:     id(session.customer as string | null),
    stripeSubscriptionId: id(session.subscription as string | null),
  };
}

export async function verifyStripe(payment: PaymentRow): Promise<Verified> {
  if (!payment.provider_ref) return { ok: false, reason: 'No Stripe session' };
  const session = await getStripe().checkout.sessions.retrieve(payment.provider_ref);
  if (session.status === 'expired') return { ok: false, reason: 'Checkout expired', final: 'expired' };
  return checkStripeSession(session, payment);
}

export async function verifyPaystack(payment: PaymentRow): Promise<Verified> {
  if (!payment.provider_ref) return { ok: false, reason: 'No Paystack reference' };
  const body = await verifyPaystackTransaction(encodeURIComponent(payment.provider_ref));
  const tx = body?.data;
  if (!tx)                                        return { ok: false, reason: 'Transaction not found' };
  if (tx.status === 'failed' || tx.status === 'reversed') return { ok: false, reason: `Payment ${tx.status}`, final: 'failed' };
  if (tx.status !== 'success')                    return { ok: false, reason: 'Payment not completed' };
  if (tx.reference !== payment.provider_ref)      return { ok: false, reason: 'Reference mismatch' };
  if (tx.currency !== 'NGN')                      return { ok: false, reason: 'Unexpected currency' };
  if (tx.amount < minorUnits(payment.amount))     return { ok: false, reason: 'Amount too low' };
  return { ok: true, providerPaymentId: String(tx.id) };
}

export async function verifyCrypto(payment: PaymentRow, nowPaymentId: string | number): Promise<Verified> {
  const p = await getPayment(nowPaymentId);
  if (String(p.order_id) !== payment.id)           return { ok: false, reason: 'Payment is for another order' };
  if (p.payment_status === 'failed' || p.payment_status === 'refunded') {
    return { ok: false, reason: `Crypto payment ${p.payment_status}`, final: 'failed' };
  }
  if (p.payment_status === 'expired')              return { ok: false, reason: 'Crypto payment expired', final: 'expired' };
  if (p.payment_status === 'partially_paid')       return { ok: false, reason: 'Partially paid: less than the full amount arrived' };
  if (p.payment_status !== 'finished')             return { ok: false, reason: `Waiting for confirmation (${p.payment_status})` };
  if (String(p.price_currency).toLowerCase() !== 'usd') return { ok: false, reason: 'Unexpected currency' };
  if (minorUnits(p.price_amount) < minorUnits(payment.amount)) return { ok: false, reason: 'Amount too low' };
  return { ok: true, providerPaymentId: String(p.payment_id) };
}
