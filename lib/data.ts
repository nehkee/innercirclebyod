/**
 * Server-side data loaders for public pages.
 *
 * Source of truth is Supabase. When Supabase isn't connected, development
 * builds fall back to clearly-fake sample data (lib/placeholder.ts) so the
 * design can be previewed; production shows empty states instead of
 * invented numbers.
 */
import type { Event, MembershipTier } from '@/types';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  showPlaceholderContent,
  placeholderEvents,
  PLACEHOLDER_STATS,
  PLACEHOLDER_LEADERBOARD,
} from '@/lib/placeholder';

export interface CommunityStats {
  members:   number;
  events:    number;
  cities:    number;
  countries: number;
}

export interface LeaderboardEntry {
  rank:     number;
  username: string;
  tier:     MembershipTier;
  points:   number;
  country?: string | null;
  joinedAt?:       string;
  eventsAttended?: number;
}

interface EventRow {
  id: string; title: string; type: Event['type']; date: string;
  location: string; venue: string | null; description: string | null;
  price_usd: number | string; price_ngn: number | string;
  capacity: number; sold: number;
  is_vip: boolean; is_secret: boolean; min_tier: MembershipTier | null;
  image_url: string | null;
}

function toEvent(r: EventRow): Event {
  return {
    id:          r.id,
    title:       r.title,
    type:        r.type,
    date:        r.date,
    location:    r.location,
    venue:       r.venue ?? undefined,
    description: r.description ?? '',
    priceUSD:    Number(r.price_usd),
    priceNGN:    Number(r.price_ngn),
    capacity:    r.capacity,
    sold:        r.sold,
    isVip:       r.is_vip,
    isSecret:    r.is_secret,
    minTier:     r.min_tier ?? undefined,
    imageUrl:    r.image_url ?? undefined,
  };
}

const EVENT_COLUMNS =
  'id, title, type, date, location, venue, description, price_usd, price_ngn, capacity, sold, is_vip, is_secret, min_tier, image_url';

/** Published events, soonest first. Past events (most recent first) appended when includePast. */
export async function getEvents({ includePast = false } = {}): Promise<Event[]> {
  let all: Event[];

  if (isSupabaseConfigured()) {
    const { data, error } = await createAdminClient()
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('is_active', true)
      .order('date', { ascending: true });
    if (error) {
      console.error('getEvents failed:', error.message);
      return [];
    }
    all = (data as EventRow[]).map(toEvent);
  } else {
    all = showPlaceholderContent() ? placeholderEvents() : [];
  }

  const now      = Date.now();
  const upcoming = all.filter(e => new Date(e.date).getTime() >= now);
  if (!includePast) return upcoming;

  const past = all.filter(e => new Date(e.date).getTime() < now).reverse();
  return [...upcoming, ...past];
}

export async function getEvent(id: string): Promise<Event | null> {
  if (isSupabaseConfigured()) {
    // Avoid a database error for non-UUID ids (e.g. old links)
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data } = await createAdminClient()
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();
    return data ? toEvent(data as EventRow) : null;
  }
  return showPlaceholderContent() ? placeholderEvents().find(e => e.id === id) ?? null : null;
}

/** Real community numbers, or null when there's nothing honest to show. */
export async function getCommunityStats(): Promise<CommunityStats | null> {
  if (!isSupabaseConfigured()) return showPlaceholderContent() ? PLACEHOLDER_STATS : null;

  const { data, error } = await createAdminClient().rpc('community_stats');
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    if (error) console.error('community_stats failed:', error.message);
    return null;
  }

  const stats = {
    members:   Number(row.members),
    events:    Number(row.events),
    cities:    Number(row.cities),
    countries: Number(row.countries),
  };
  return stats.members > 0 ? stats : null;
}

export async function getLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return showPlaceholderContent() ? PLACEHOLDER_LEADERBOARD.slice(0, limit) : [];

  const { data, error } = await createAdminClient()
    .from('members')
    .select('username, tier, points, country, created_at, tickets(count)')
    .is('deleted_at', null)
    .gt('points', 0)
    .order('points', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getLeaderboard failed:', error.message);
    return [];
  }

  return (data ?? []).map((m, i) => ({
    rank:     i + 1,
    username: m.username ?? 'MEMBER',
    tier:     m.tier as MembershipTier,
    points:   m.points,
    country:  m.country,
    joinedAt: m.created_at,
    eventsAttended: Array.isArray(m.tickets) ? Number((m.tickets[0] as { count?: number })?.count ?? 0) : 0,
  }));
}
