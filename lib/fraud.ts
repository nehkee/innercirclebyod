import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limiter backed by Supabase (rate_limit_hit in supabase/schema.sql), so
 * limits hold across serverless instances. Falls back to an in-process
 * counter only when Supabase isn't configured (local development) or the
 * database call fails, so a database hiccup never takes the site down.
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now   = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }
  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: new Date(entry.resetAt) };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!isSupabaseConfigured()) return memoryRateLimit(key, limit, windowMs);

  const { data, error } = await createAdminClient().rpc('rate_limit_hit', {
    p_key:       key,
    p_limit:     limit,
    p_window_ms: windowMs,
  });

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    console.error('rate_limit_hit failed, using in-memory fallback:', error?.message);
    return memoryRateLimit(key, limit, windowMs);
  }

  return { allowed: row.allowed, remaining: row.remaining, resetAt: new Date(row.reset_at) };
}

/** Extract a stable client identifier from the request */
export function clientId(req: NextRequest): string {
  // Vercel sets x-real-ip to the true client IP; x-forwarded-for's first entry can be spoofed elsewhere.
  const realIp    = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

/** Check for duplicate ticket purchase in the same event */
export async function isDuplicateTicket(
  memberId: string,
  eventId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tickets')
    .select('id')
    .eq('user_id', memberId)
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Check if a member (members.id UUID) has an active membership at the required tier */
export async function hasMembershipAccess(
  memberId: string,
  requiredTier: string
): Promise<boolean> {
  const TIER_ORDER = ['machine', 'insider', 'warlord', 'industry'];
  const admin      = createAdminClient();

  const { data } = await admin
    .from('memberships')
    .select('tier, status')
    .eq('user_id', memberId)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return false;

  return TIER_ORDER.indexOf(data.tier) >= TIER_ORDER.indexOf(requiredTier);
}

/** Verify Paystack webhook signature */
export function verifyPaystackWebhook(
  payload: string,
  sig: string
): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !sig) return false;
  const hash = createHmac('sha512', secret).update(payload).digest('hex');
  const a = Buffer.from(hash);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
