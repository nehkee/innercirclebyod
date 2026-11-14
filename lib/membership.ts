import type { MembershipTier } from '@/types';
import { createAdminClient } from '@/lib/supabase';

export const TIER_ORDER: MembershipTier[] = ['machine', 'insider', 'warlord', 'industry'];

/**
 * The member's currently-paid tier, or null. A membership counts while its
 * status is 'active' and its paid period hasn't ended (Stripe subscriptions
 * are kept current by webhooks; one-time Paystack/crypto passes simply expire).
 */
export async function getActiveTier(memberId: string): Promise<MembershipTier | null> {
  const { data } = await createAdminClient()
    .from('memberships')
    .select('tier, status, current_period_end')
    .eq('user_id', memberId)
    .maybeSingle();

  if (!data || data.status !== 'active') return null;
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) return null;
  return data.tier as MembershipTier;
}

export async function hasTierAccess(memberId: string, required: MembershipTier): Promise<boolean> {
  const tier = await getActiveTier(memberId);
  return tier !== null && TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(required);
}
