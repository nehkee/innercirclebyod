/**
 * Retention and refund settings. Change the numbers here; the chat bot,
 * account page and admin tools all read from this file.
 */
export const RETENTION = {
  /** "20% off your next event" */
  eventDiscountPercent:      20,
  /** "20% off your next month" */
  membershipDiscountPercent: 20,
  /** Same-price upgrade to the tier above, for this many months */
  upgradeMonths:             2,
  /** Pause a card membership (no billing, no access) for this many months */
  pauseMonths:               1,
  /** Unused discounts lapse after this many days */
  discountValidDays:         90,
  /** The bot offers each perk at most once per member in this window (team can always grant) */
  offerCooldownDays:         180,
  /** Refunds the member still insists on are processed within this many days */
  refundDays:                7,
} as const;

export const TEAM_REPLY_PROMISE = 'We usually reply within a few hours.';
