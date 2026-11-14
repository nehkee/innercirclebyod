import { describe, it, expect } from 'vitest';
import { effectiveTier, nextTier, type MembershipRow } from '@/lib/membership';

const day = 86_400_000;
const iso = (d: number) => new Date(Date.now() + d * day).toISOString();
const base: MembershipRow = {
  user_id: 'm', tier: 'insider', status: 'active', payment_provider: 'stripe', stripe_sub_id: 'sub_1',
  current_period_end: iso(10), cancel_at_period_end: false, paused_until: null, bonus_tier: null, bonus_until: null,
};

describe('effectiveTier', () => {
  it('grants the paid tier inside the period', () => expect(effectiveTier(base)).toBe('insider'));
  it('expires after the period ends', () => expect(effectiveTier({ ...base, current_period_end: iso(-1) })).toBeNull());
  it('keeps access while a failed renewal is retried', () => expect(effectiveTier({ ...base, status: 'past_due' })).toBe('insider'));
  it('cancelled memberships grant nothing', () => expect(effectiveTier({ ...base, status: 'cancelled' })).toBeNull());
  it('a retention pause turns access off until it ends', () => {
    expect(effectiveTier({ ...base, paused_until: iso(5) })).toBeNull();
    expect(effectiveTier({ ...base, paused_until: iso(-1) })).toBe('insider');
  });
  it('a same-price upgrade raises the tier until it lapses', () => {
    expect(effectiveTier({ ...base, bonus_tier: 'vanguard', bonus_until: iso(30) })).toBe('vanguard');
    expect(effectiveTier({ ...base, bonus_tier: 'vanguard', bonus_until: iso(-1) })).toBe('insider');
    expect(effectiveTier({ ...base, bonus_tier: 'initiate', bonus_until: iso(30) })).toBe('insider');
  });
  it('cancelling at period end keeps access until then', () => expect(effectiveTier({ ...base, cancel_at_period_end: true })).toBe('insider'));
  it('nextTier walks up the ladder', () => {
    expect(nextTier('initiate')).toBe('insider');
    expect(nextTier('sovereign')).toBeNull();
  });
});
