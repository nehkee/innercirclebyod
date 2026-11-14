/**
 * Drops (limited merch / music / access) and raffles: server-side loaders.
 * Secret drops are redacted until unlocked with their password, which is only
 * ever checked on the server.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { showPlaceholderContent } from '@/lib/placeholder';
import type { MembershipTier } from '@/types';

export interface DropView {
  id:          string;
  name:        string;
  type:        'merch' | 'music' | 'ticket' | 'invite';
  description: string;
  priceUSD:    number;
  priceNGN:    number;
  quantity:    number;
  sold:        number;
  dropDate:    string;
  endsAt:      string | null;
  imageUrl:    string | null;
  minTier:     MembershipTier | null;
  isPasswordProtected: boolean;
  isSecret:    boolean;
  /** True when name/description are hidden until the password is entered. */
  redacted:    boolean;
}

export interface RaffleView {
  id:          string;
  title:       string;
  description: string | null;
  prize:       string;
  closesAt:    string | null;
  minTier:     MembershipTier | null;
  entries:     number;   // total entry rows (VANGUARD+ members hold several)
  entrants:    number;   // distinct members
  bonusEntries: number;  // entries per VANGUARD+ member
}

interface DropRow {
  id: string; name: string; type: DropView['type']; description: string | null;
  price_usd: number | string; price_ngn: number | string; quantity: number; sold: number;
  drop_date: string; ends_at: string | null; image_url: string | null; min_tier: MembershipTier | null;
  is_password_protected: boolean; is_secret: boolean; password_hash?: string | null;
}

export function hashDropPassword(dropId: string, password: string): string {
  return createHash('sha256').update(`${dropId}:${password.trim().toUpperCase()}`).digest('hex');
}

export function checkDropPassword(dropId: string, password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashDropPassword(dropId, password));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

function toView(r: DropRow, unlocked = false): DropView {
  const redacted = r.is_secret && !unlocked;
  return {
    id: r.id,
    name:        redacted ? '[CLASSIFIED]' : r.name,
    type:        r.type,
    description: redacted ? 'Locked. Members with the password know what this is.' : r.description ?? '',
    priceUSD:    Number(r.price_usd),
    priceNGN:    Number(r.price_ngn),
    quantity:    r.quantity,
    sold:        r.sold,
    dropDate:    r.drop_date,
    endsAt:      r.ends_at,
    imageUrl:    redacted ? null : r.image_url,
    minTier:     r.min_tier,
    isPasswordProtected: r.is_password_protected,
    isSecret:    r.is_secret,
    redacted,
  };
}

const DROP_COLUMNS =
  'id, name, type, description, price_usd, price_ngn, quantity, sold, drop_date, ends_at, image_url, min_tier, is_password_protected, is_secret';

export async function getDrops(): Promise<DropView[]> {
  if (!isSupabaseConfigured()) return showPlaceholderContent() ? placeholderDrops() : [];
  const { data, error } = await createAdminClient()
    .from('drops')
    .select(DROP_COLUMNS)
    .eq('is_active', true)
    .order('drop_date', { ascending: true });
  if (error) { console.error('getDrops failed:', error.message); return []; }
  return (data as DropRow[]).map(r => toView(r));
}

/** Full drop row including the password hash (server only). */
export async function getDropRow(dropId: string): Promise<(DropRow & { is_active: boolean }) | null> {
  const { data } = await createAdminClient()
    .from('drops')
    .select(`${DROP_COLUMNS}, password_hash, is_active`)
    .eq('id', dropId)
    .maybeSingle();
  return (data as (DropRow & { is_active: boolean }) | null) ?? null;
}

export async function unlockDrop(dropId: string, password: string): Promise<DropView | null> {
  const row = await getDropRow(dropId);
  if (!row || !row.is_active || !row.is_password_protected) return null;
  return checkDropPassword(dropId, password, row.password_hash) ? toView(row, true) : null;
}

export async function getRaffles(): Promise<RaffleView[]> {
  if (!isSupabaseConfigured()) return showPlaceholderContent() ? placeholderRaffles() : [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('raffles')
    .select('id, title, description, prize_description, closes_at, min_tier, entries_per_warlord')
    .eq('status', 'open')
    .order('closes_at', { ascending: true });
  if (error) { console.error('getRaffles failed:', error.message); return []; }

  const now = Date.now();
  const open = (data ?? []).filter(r => !r.closes_at || new Date(r.closes_at).getTime() > now);
  return Promise.all(open.map(async r => {
    const { data: entries } = await admin.from('raffle_entries').select('user_id').eq('raffle_id', r.id);
    return {
      id: r.id, title: r.title, description: r.description, prize: r.prize_description,
      closesAt: r.closes_at, minTier: r.min_tier, bonusEntries: r.entries_per_warlord,
      entries: entries?.length ?? 0, entrants: new Set((entries ?? []).map(e => e.user_id)).size,
    };
  }));
}

// ─── Development samples (never shown in production) ───────────────────────────

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

function placeholderDrops(): DropView[] {
  const base = { endsAt: null, imageUrl: null, isPasswordProtected: false, isSecret: false, redacted: false, minTier: null };
  return [
    { ...base, id: 'sample-tee', name: 'CIRCLE TEE — VOL. 1', type: 'merch', description: 'Heavyweight 350gsm. Embroidered ◯. Limited to 200. No restock.', priceUSD: 30, priceNGN: 45000, quantity: 200, sold: 174, dropDate: daysFromNow(-3) },
    { ...base, id: 'sample-ep', name: 'THE VAULT — UNRELEASED EP', type: 'music', description: 'Three tracks recorded, never released. Digital only. INSIDER+.', priceUSD: 5, priceNGN: 8000, quantity: 500, sold: 312, dropDate: daysFromNow(4), minTier: 'insider' },
    { ...base, id: 'sample-secret', name: '[CLASSIFIED]', type: 'merch', description: 'Locked. Members with the password know what this is.', priceUSD: 0, priceNGN: 0, quantity: 50, sold: 0, dropDate: daysFromNow(-1), isPasswordProtected: true, isSecret: true, redacted: true, minTier: 'vanguard' },
    { ...base, id: 'sample-hoodie', name: 'INNER CIRCLE HOODIE — BLACK', type: 'merch', description: 'Thick cotton. No logos on the front. Just the ◯ on the chest. 300 units.', priceUSD: 42, priceNGN: 65000, quantity: 300, sold: 289, dropDate: daysFromNow(-10) },
  ];
}

function placeholderRaffles(): RaffleView[] {
  return [
    { id: 'sample-r1', title: 'THE ONE-ON-ONE', description: null, prize: 'A one-on-one with the artist + signed vinyl', closesAt: daysFromNow(9), minTier: 'initiate', entries: 847, entrants: 690, bonusEntries: 2 },
    { id: 'sample-r2', title: 'STUDIO TOUR', description: null, prize: 'Full tour of the label HQ + photo with the A&R team', closesAt: daysFromNow(16), minTier: 'initiate', entries: 234, entrants: 201, bonusEntries: 2 },
    { id: 'sample-r3', title: 'FIRST LISTEN', description: null, prize: 'Private listening session before the public release', closesAt: daysFromNow(30), minTier: 'insider', entries: 156, entrants: 120, bonusEntries: 2 },
  ];
}
