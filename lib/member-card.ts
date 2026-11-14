import { createHmac, timingSafeEqual } from 'crypto';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase';
import { getMembership, effectiveTier } from '@/lib/membership';
import { siteUrl } from '@/lib/brand';
import type { MembershipTier } from '@/types';

function secret(): string {
  const s = process.env.TICKET_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('TICKET_SECRET must be set in production');
  return 'dev-only-ticket-secret';
}

/** Signed, non-expiring member identifier for the card QR ("m." prefix keeps it distinct from tickets). */
export function memberCardToken(memberId: string): string {
  const id = Buffer.from(memberId).toString('base64url');
  const sig = createHmac('sha256', secret()).update(`member:${id}`).digest('base64url').slice(0, 22);
  return `m.${id}.${sig}`;
}

export function verifyMemberCardToken(token: string): string | null {
  const [prefix, id, sig] = token.split('.');
  if (prefix !== 'm' || !id || !sig) return null;
  const expected = Buffer.from(createHmac('sha256', secret()).update(`member:${id}`).digest('base64url').slice(0, 22));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Buffer.from(id, 'base64url').toString();
}

export const memberNumber = (memberId: string) => `IC-${memberId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

export interface MemberCard {
  username:  string;
  tier:      MembershipTier | null;
  since:     string;
  number:    string;
  verifyUrl: string;
}

export async function getMemberCard(memberId: string): Promise<MemberCard | null> {
  const { data: m } = await createAdminClient()
    .from('members').select('id, username, created_at').eq('id', memberId).maybeSingle();
  if (!m) return null;
  const tier = effectiveTier(await getMembership(memberId));
  return {
    username:  m.username ?? 'MEMBER',
    tier,
    since:     new Date(m.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase(),
    number:    memberNumber(m.id),
    verifyUrl: `${siteUrl()}/verify?m=${encodeURIComponent(memberCardToken(m.id))}`,
  };
}

export async function cardQrDataUrl(url: string, dark = '#080808', light = '#FFFFFF'): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: 'M', color: { dark, light } });
}
