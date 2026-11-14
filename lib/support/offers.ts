/**
 * Retention perks: discounts, same-price upgrades and pauses.
 * Used by the support bot (one tap) and by the team from the admin inbox.
 */
import { createAdminClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { getMembership, nextTier, effectiveTier } from '@/lib/membership';
import { RETENTION } from '@/lib/support/config';
import type { MembershipTier } from '@/types';

export type OfferKind = 'event_discount' | 'membership_discount' | 'tier_upgrade' | 'pause';

const DAY = 86_400_000;
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

/** Has the bot already given this member this kind of perk recently? (Team grants ignore this.) */
export async function offeredRecently(memberId: string, kind: OfferKind): Promise<boolean> {
  const since = new Date(Date.now() - RETENTION.offerCooldownDays * DAY).toISOString();
  const { count } = await createAdminClient()
    .from('member_offers')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('kind', kind)
    .gte('created_at', since);
  return (count ?? 0) > 0;
}

/** Which membership perks can be offered right now (eligibility + cooldown). */
export async function availableMembershipOffers(memberId: string) {
  const m = await getMembership(memberId);
  const active = effectiveTier(m) !== null || Boolean(m?.paused_until && new Date(m.paused_until) > new Date());
  const isCardSub = Boolean(m?.stripe_sub_id) && m?.payment_provider === 'stripe';
  const upgradeTo = m ? nextTier(m.tier) : null;

  const [d, u, p, e] = await Promise.all([
    offeredRecently(memberId, 'membership_discount'),
    offeredRecently(memberId, 'tier_upgrade'),
    offeredRecently(memberId, 'pause'),
    offeredRecently(memberId, 'event_discount'),
  ]);

  return {
    membership: m,
    active,
    isCardSub,
    upgradeTo,
    discount:      active && !d,
    upgrade:       active && !u && upgradeTo !== null && !(m?.bonus_until && new Date(m.bonus_until) > new Date()),
    pause:         active && !p && isCardSub,
    eventDiscount: !e,
  };
}

interface GrantContext { threadId?: string; source?: 'bot' | 'team'; grantedBy?: string }

/** Discount on the next event ticket, applied automatically at checkout. */
export async function grantEventDiscount(memberId: string, percent: number = RETENTION.eventDiscountPercent, ctx: GrantContext = {}) {
  await insertOffer(memberId, {
    kind: 'event_discount', percent,
    expires_at: new Date(Date.now() + RETENTION.discountValidDays * DAY).toISOString(),
  }, ctx);
  return `${percent}% off your next event is saved to your account. It applies automatically at checkout (valid ${RETENTION.discountValidDays} days).`;
}

/**
 * Discount on the next membership payment. Card subscriptions get a Stripe
 * coupon on the next invoice; Paystack/crypto members get it at their next renewal checkout.
 */
export async function grantMembershipDiscount(memberId: string, percent: number = RETENTION.membershipDiscountPercent, ctx: GrantContext = {}) {
  const m = await getMembership(memberId);
  if (m?.stripe_sub_id && m.payment_provider === 'stripe') {
    const stripe = getStripe();
    const coupon = await stripe.coupons.create({ percent_off: percent, duration: 'once', name: `Retention ${percent}%` });
    await stripe.subscriptions.update(m.stripe_sub_id, { coupon: coupon.id });
    await insertOffer(memberId, { kind: 'membership_discount', percent, used_at: new Date().toISOString() }, ctx);
    return `Done — ${percent}% off your next monthly payment. It's applied automatically.`;
  }
  await insertOffer(memberId, {
    kind: 'membership_discount', percent,
    expires_at: new Date(Date.now() + RETENTION.discountValidDays * DAY).toISOString(),
  }, ctx);
  return `${percent}% off your next membership renewal is saved to your account. It applies automatically when you renew.`;
}

/** Same-price upgrade to the tier above for N months. */
export async function grantTierUpgrade(memberId: string, months: number = RETENTION.upgradeMonths, ctx: GrantContext = {}, toTier?: MembershipTier) {
  const m = await getMembership(memberId);
  if (!m) throw new Error('No membership to upgrade');
  const target = toTier ?? nextTier(m.tier);
  if (!target) throw new Error('Already on the top tier');

  const until = addMonths(new Date(), months);
  const { error } = await createAdminClient()
    .from('memberships')
    .update({ bonus_tier: target, bonus_until: until.toISOString() })
    .eq('user_id', memberId);
  if (error) throw new Error(error.message);

  await insertOffer(memberId, { kind: 'tier_upgrade', tier: target, months, used_at: new Date().toISOString() }, ctx);
  return `You're now ${target.toUpperCase()} for the next ${months} month${months > 1 ? 's' : ''} at your current price. Enjoy the upgrade.`;
}

/** Pause a card subscription: no charges and no access until it resumes. */
export async function pauseMembership(memberId: string, months: number = RETENTION.pauseMonths, ctx: GrantContext = {}) {
  const m = await getMembership(memberId);
  if (!m?.stripe_sub_id) throw new Error('Only card memberships can be paused');

  const resumes = addMonths(new Date(), months);
  await getStripe().subscriptions.update(m.stripe_sub_id, {
    pause_collection: { behavior: 'void', resumes_at: Math.floor(resumes.getTime() / 1000) },
  });
  await createAdminClient().from('memberships').update({ paused_until: resumes.toISOString() }).eq('user_id', memberId);
  await insertOffer(memberId, { kind: 'pause', months, used_at: new Date().toISOString() }, ctx);
  return `Your membership is paused until ${resumes.toDateString()}. No charges until then, and your seat is held.`;
}

/** Best unused, unexpired discount of a kind (for checkout). */
export async function findUsableDiscount(memberId: string, kind: 'event_discount' | 'membership_discount') {
  const { data } = await createAdminClient()
    .from('member_offers')
    .select('id, percent, expires_at')
    .eq('member_id', memberId)
    .eq('kind', kind)
    .is('used_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('percent', { ascending: false })
    .limit(1);
  const offer = data?.[0];
  return offer?.percent ? { id: offer.id as string, percent: offer.percent as number } : null;
}

/** Mark a discount as consumed by a fulfilled payment. */
export async function consumeOffer(offerId: string, paymentId: string) {
  await createAdminClient()
    .from('member_offers')
    .update({ used_at: new Date().toISOString(), payment_id: paymentId })
    .eq('id', offerId)
    .is('used_at', null);
}

async function insertOffer(memberId: string, fields: Record<string, unknown>, ctx: GrantContext) {
  const { error } = await createAdminClient().from('member_offers').insert({
    member_id:  memberId,
    source:     ctx.source ?? 'bot',
    granted_by: ctx.grantedBy ?? null,
    thread_id:  ctx.threadId ?? null,
    ...fields,
  });
  if (error) throw new Error(`Could not save offer: ${error.message}`);
}
