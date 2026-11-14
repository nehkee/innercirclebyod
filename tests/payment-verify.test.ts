import { describe, it, expect } from 'vitest';
import type Stripe from 'stripe';
import { checkStripeSession } from '@/lib/payments/verify';
import type { PaymentRow } from '@/lib/payments/types';

const payment = { id: 'pay-1', amount: 75, currency: 'USD' } as PaymentRow;
const session = (over: Partial<Stripe.Checkout.Session> = {}) => ({
  metadata: { paymentId: 'pay-1' }, payment_status: 'paid', currency: 'usd', amount_total: 7500,
  payment_intent: 'pi_1', subscription: null, customer: 'cus_1', ...over,
}) as unknown as Stripe.Checkout.Session;

describe('Stripe checkout verification', () => {
  it('accepts a paid session for this payment', () => {
    expect(checkStripeSession(session(), payment)).toMatchObject({ ok: true, providerPaymentId: 'pi_1', stripeCustomerId: 'cus_1' });
  });
  it('rejects anything that does not match', () => {
    expect(checkStripeSession(session({ payment_status: 'unpaid' }), payment).ok).toBe(false);
    expect(checkStripeSession(session({ amount_total: 100 }), payment).ok).toBe(false);
    expect(checkStripeSession(session({ currency: 'eur' }), payment).ok).toBe(false);
    expect(checkStripeSession(session({ metadata: { paymentId: 'other' } }), payment).ok).toBe(false);
  });
  it('a discounted payment verifies against the discounted amount', () => {
    expect(checkStripeSession(session({ amount_total: 6000 }), { ...payment, amount: 60 }).ok).toBe(true);
  });
});
