import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe Price IDs for each membership tier (USD)
export const STRIPE_PRICE_IDS: Record<string, string> = {
  machine:  process.env.STRIPE_MACHINE_PRICE_ID  || '',
  insider:  process.env.STRIPE_INSIDER_PRICE_ID  || '',
  warlord:  process.env.STRIPE_WARLORD_PRICE_ID  || '',
  industry: process.env.STRIPE_INDUSTRY_PRICE_ID || '',
};
