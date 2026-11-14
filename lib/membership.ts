import type { MembershipTier } from '@/types';
import { createAdminClient } from '@/lib/supabase';

export const TIER_ORDER: MembershipTier[] = ['initiate', 'insider', 'vanguard', 'sovereign'];

export function tierRank(tier: MembershipTier | null | undefined): number {
  return tier ? TIER_ORDER.indexOf(tier) : -1;
}

export function nextTier(tier: MembershipTier): MembershipTier | null {
  return TIER_ORDER[TIER_ORDER.indexOf(tier) + 1] ?? null;
}

export interface MembershipRow {
  user_id:              string;
  tier:                 MembershipTier;
  status:               string;
  payment_provider:     'stripe' | 'paystack' | 'crypto' | null;
  stripe_sub_id:        string | null;
  current_period_end:   string | null;
  cancel_at_period_end: boolean;
  paused_until:         string | null;
  bonus_tier:           MembershipTier | null;
  bonus_until:          string | null;
}

export async function getMembership(memberId: string): Promise<MembershipRow | null> {
  const { data } = await createAdminClient()
    .from('memberships')
    .select('user_id, tier, status, payment_provider, stripe_sub_id, current_period_end, cancel_at_period_end, paused_until, bonus_tier, bonus_until')
    .eq('user_id', memberId)
    .maybeSingle();
  return (data as MembershipRow | null) ?? null;
}

/**
 * The tier a membership row currently grants, or null.
 * Counts while 'active' and inside the paid period; a retention pause turns
 * access off, and a retention upgrade raises the tier until it lapses.
 */
export function effectiveTier(m: MembershipRow | null, now = new Date()): MembershipTier | null {
  if (!m || m.status !== 'active') return null;
  if (m.current_period_end && new Date(m.current_period_end) < now) return null;
  if (m.paused_until && new Date(m.paused_until) > now) return null;
  if (m.bonus_tier && m.bonus_until && new Date(m.bonus_until) > now && tierRank(m.bonus_tier) > tierRank(m.tier)) {
    return m.bonus_tier;
  }
  return m.tier;
}

export async function getActiveTier(memberId: string): Promise<MembershipTier | null> {
  return effectiveTier(await getMembership(memberId));
}

export async function hasTierAccess(memberId: string, required: MembershipTier): Promise<boolean> {
  const tier = await getActiveTier(memberId);
  return tier !== null && tierRank(tier) >= tierRank(required);
}
