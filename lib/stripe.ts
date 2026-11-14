import Stripe from 'stripe';

let client: Stripe | null = null;

/** Lazily created so the app still builds and runs without Stripe keys. */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  return client;
}
