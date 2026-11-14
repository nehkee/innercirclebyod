/**
 * Sample content for local development and design previews ONLY.
 * None of this is real. It is shown when Supabase isn't connected and
 * showPlaceholderContent() is true (development, or the env flag in production).
 */
import type { Event } from '@/types';
import type { CommunityStats, LeaderboardEntry } from '@/lib/data';

/** True in development; in production only if explicitly enabled. */
export function showPlaceholderContent(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SHOW_PLACEHOLDER_CONTENT === 'true'
  );
}

const daysFromNow = (d: number, hour = 20) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

/** Dates are relative to today so the preview never shows expired events. */
export function placeholderEvents(): Event[] {
  return [
    {
      id: 'sample-listening-party', title: 'WARLORD SEASON LISTENING PARTY', type: 'listening_party',
      date: daysFromNow(21), location: 'Lagos, Nigeria', venue: 'Secret Location — INSIDER+ Only',
      description: 'Exclusive first listen. Full playback. No phones.',
      priceUSD: 75, priceNGN: 115000, capacity: 150, sold: 127, isVip: true, isSecret: true, minTier: 'insider',
    },
    {
      id: 'sample-london-show', title: 'UNDERGROUND SHOW — LONDON', type: 'show',
      date: daysFromNow(42, 21), location: 'London, UK', venue: 'Undisclosed Venue',
      description: 'Small room. Full energy. Limited capacity.',
      priceUSD: 120, priceNGN: 180000, capacity: 300, sold: 241,
    },
    {
      id: 'sample-abuja-hangout', title: 'INDUSTRY MACHINE HANGOUT — ABUJA', type: 'hangout',
      date: daysFromNow(56, 16), location: 'Abuja, Nigeria', venue: 'Private Residence',
      description: 'Football + dinner + studio time with OD. WARLORD+ members only.',
      priceUSD: 0, priceNGN: 0, capacity: 20, sold: 18, isVip: true, isSecret: true, minTier: 'warlord',
    },
    {
      id: 'sample-past-fest', title: 'ALARA FEST — LAGOS', type: 'show',
      date: daysFromNow(-30, 21), location: 'Lagos, Nigeria', venue: 'Eko Convention Centre',
      description: 'The biggest night of the year.',
      priceUSD: 60, priceNGN: 90000, capacity: 3000, sold: 3000,
    },
  ];
}

export const PLACEHOLDER_STATS: CommunityStats = {
  members: 12400, events: 48, cities: 14, countries: 9,
};

export const PLACEHOLDER_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  username: 'WARLORD_ABUJA',  tier: 'industry', points: 24500, country: 'NG', joinedAt: '2024-01-10', eventsAttended: 18 },
  { rank: 2,  username: 'MACHINE_ADEOLU', tier: 'warlord',  points: 19200, country: 'NG', joinedAt: '2024-02-03', eventsAttended: 14 },
  { rank: 3,  username: 'INSIDER_LONDON', tier: 'warlord',  points: 17800, country: 'GB', joinedAt: '2024-03-15', eventsAttended: 11 },
  { rank: 4,  username: 'OD_STEPH',       tier: 'insider',  points: 15400, country: 'US', joinedAt: '2024-04-02', eventsAttended: 9  },
  { rank: 5,  username: 'CIRCUIT_KEMI',   tier: 'insider',  points: 14100, country: 'NG', joinedAt: '2024-01-22', eventsAttended: 12 },
  { rank: 6,  username: 'NATIVESON',      tier: 'insider',  points: 12900, country: 'NG', joinedAt: '2024-05-09', eventsAttended: 8  },
  { rank: 7,  username: 'LAGOS_CULT',     tier: 'warlord',  points: 11500, country: 'NG', joinedAt: '2024-06-18', eventsAttended: 7  },
  { rank: 8,  username: 'UK_MACHINE',     tier: 'insider',  points: 10200, country: 'GB', joinedAt: '2024-02-27', eventsAttended: 6  },
  { rank: 9,  username: 'ABUJA_SOLDIER',  tier: 'insider',  points: 9800,  country: 'NG', joinedAt: '2024-07-04', eventsAttended: 5  },
  { rank: 10, username: 'GRIND_CHUKWU',   tier: 'machine',  points: 8700,  country: 'NG', joinedAt: '2024-08-11', eventsAttended: 4  },
];
