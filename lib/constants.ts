import type { TierConfig } from '@/types';

/**
 * Membership tiers. Ids are stored in the database (membership_tier enum);
 * names, taglines, prices and benefits can be changed freely here.
 */
export const TIERS: TierConfig[] = [
  {
    id:       'initiate',
    name:     'INITIATE',
    tagline:  'Enter the circle.',
    priceUSD: 10,
    priceNGN: 15000,
    color:    '#9CA3AF',
    colorRgb: '156,163,175',
    benefits: [
      'Access to the member feed',
      'First look at event drops',
      'Monthly digital dispatch',
      'Initiate digital badge',
      'Community Discord access',
    ],
    exclusive: [
      'Digital collectible on sign-up',
    ],
  },
  {
    id:       'insider',
    name:     'INSIDER',
    tagline:  'First through the door.',
    priceUSD: 25,
    priceNGN: 38000,
    color:    '#C9A84C',
    colorRgb: '201,168,76',
    featured: true,
    benefits: [
      'Everything in INITIATE',
      '48h priority ticket window',
      'Insider-only Discord',
      'Monthly curated playlist drops',
      'Behind-the-scenes content',
      'Event photo archives',
    ],
    exclusive: [
      'Limited edition Insider merch access',
      'Insider-only listening sessions',
    ],
  },
  {
    id:       'vanguard',
    name:     'VANGUARD',
    tagline:  'Front of every line.',
    priceUSD: 75,
    priceNGN: 115000,
    color:    '#CC0000',
    colorRgb: '204,0,0',
    benefits: [
      'Everything in INSIDER',
      'Quarterly member meetups',
      'Signed merch early access',
      'Monthly studio session raffle entries',
      'Private content drops',
      'Direct updates from the team',
    ],
    exclusive: [
      '2x raffle entries per month',
      'Vanguard-only Discord channel',
      'Unreleased previews before anyone',
    ],
  },
  {
    id:       'sovereign',
    name:     'SOVEREIGN',
    tagline:  'The circle answers to you.',
    priceUSD: 200,
    priceNGN: 300000,
    color:    '#FFFFFF',
    colorRgb: '255,255,255',
    benefits: [
      'Everything in VANGUARD',
      'Direct line to the team',
      'Annual private show invitation',
      'Producer & creative network access',
      'VIP at all public shows',
      'Unreleased music preview access',
      'Industry networking meetup invite',
    ],
    exclusive: [
      'Personal thank-you from the artist',
      'Annual 1-on-1 virtual session',
      'Sovereign physical membership card',
    ],
  },
];
