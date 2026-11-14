/** Which payment methods are switched on (by their server-side keys being set). */
export interface PaymentMethods {
  card:     boolean;  // Stripe — cards worldwide, USD
  paystack: boolean;  // Paystack — cards, bank transfer, USSD, NGN
  crypto:   boolean;  // NOWPayments — USDT/USDC/BTC, priced in USD
}

export function enabledPaymentMethods(): PaymentMethods {
  return {
    card:     Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
    crypto:   Boolean(process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_IPN_SECRET),
  };
}

/** Public base URL for redirects and webhooks, e.g. https://innercirclebyod.com */
export function appUrl(fallbackOrigin?: string): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

/** One-time (Paystack / crypto) memberships buy this many days of access. */
export const ONE_TIME_MEMBERSHIP_DAYS = 30;
