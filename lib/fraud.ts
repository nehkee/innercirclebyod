import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Simple in-process rate limiter.
 * For production, replace with Upstash Redis or similar.
 */
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now    = Date.now();
  const entry  = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: new Date(entry.resetAt) };
}

/** Extract a stable client identifier from the request */
export function clientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip        = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

/** Check for duplicate ticket purchase in the same event */
export async function isDuplicateTicket(
  userId: string,
  eventId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tickets')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Check if a user has an active membership at the required tier */
export async function hasMembershipAccess(
  userId: string,
  requiredTier: string
): Promise<boolean> {
  const TIER_ORDER = ['machine', 'insider', 'warlord', 'industry'];
  const admin      = createAdminClient();

  const { data } = await admin
    .from('memberships')
    .select('tier, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!data) return false;

  return TIER_ORDER.indexOf(data.tier) >= TIER_ORDER.indexOf(requiredTier);
}

/** Verify Stripe webhook signature */
export function verifyStripeWebhook(
  payload: Buffer,
  sig: string,
  secret: string
): boolean {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);
    stripe.webhooks.constructEvent(payload, sig, secret);
    return true;
  } catch {
    return false;
  }
}

/** Verify Paystack webhook signature */
export function verifyPaystackWebhook(
  payload: string,
  sig: string
): boolean {
  const { createHmac } = require('crypto');
  const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex');
  return hash === sig;
}
