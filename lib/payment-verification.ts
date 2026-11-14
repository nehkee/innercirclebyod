import { verifyPaystackTransaction } from '@/lib/paystack';
import { stripe } from '@/lib/stripe';

export type PaymentCheck = { ok: true } | { ok: false; reason: string };

interface ExpectedPayment {
  /** The payment reference: Paystack transaction ref, or Stripe Checkout Session ID. */
  ref:         string;
  eventId:     string;
  memberId:    string;
  memberEmail: string;
  /** Ticket price in the payment's currency (naira for Paystack, dollars for Stripe). */
  priceNGN:    number;
  priceUSD:    number;
}

/**
 * Confirm with Paystack that the transaction succeeded, was for at least the
 * ticket price, and belongs to this member and event. Never trust the client.
 */
export async function verifyPaystackTicketPayment(p: ExpectedPayment): Promise<PaymentCheck> {
  if (!process.env.PAYSTACK_SECRET_KEY) return { ok: false, reason: 'Paystack is not configured' };

  let body: any;
  try {
    body = await verifyPaystackTransaction(encodeURIComponent(p.ref));
  } catch {
    return { ok: false, reason: 'Could not verify payment with Paystack' };
  }

  const tx = body?.data;
  if (!body?.status || tx?.status !== 'success')    return { ok: false, reason: 'Payment not successful' };
  if (tx.currency !== 'NGN')                         return { ok: false, reason: 'Unexpected payment currency' };
  if (tx.amount < Math.round(p.priceNGN * 100))      return { ok: false, reason: 'Payment amount is too low' };

  const meta = tx.metadata ?? {};
  if (meta.eventId && meta.eventId !== p.eventId)    return { ok: false, reason: 'Payment is for a different event' };
  const ownerMatches = meta.userId
    ? meta.userId === p.memberId
    : tx.customer?.email?.toLowerCase() === p.memberEmail.toLowerCase();
  if (!ownerMatches)                                 return { ok: false, reason: 'Payment belongs to another account' };

  return { ok: true };
}

/** Confirm a Stripe Checkout Session was paid, for this event, by this member. */
export async function verifyStripeTicketPayment(p: ExpectedPayment): Promise<PaymentCheck> {
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, reason: 'Stripe is not configured' };

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(p.ref);
  } catch {
    return { ok: false, reason: 'Could not verify payment with Stripe' };
  }

  if (session.payment_status !== 'paid')                       return { ok: false, reason: 'Payment not completed' };
  if (session.currency !== 'usd')                              return { ok: false, reason: 'Unexpected payment currency' };
  if (session.metadata?.eventId !== p.eventId)                 return { ok: false, reason: 'Payment is for a different event' };
  if (session.metadata?.userId && session.metadata.userId !== p.memberId) {
    return { ok: false, reason: 'Payment belongs to another account' };
  }
  if ((session.amount_total ?? 0) < Math.round(p.priceUSD * 100)) {
    return { ok: false, reason: 'Payment amount is too low' };
  }

  return { ok: true };
}
