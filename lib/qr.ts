import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import QRCode from 'qrcode';
import { siteUrl } from '@/lib/brand';

/** Signing key for ticket QR codes. Required in production: a guessable key lets anyone forge tickets. */
function getSecret(): string {
  const secret = process.env.TICKET_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TICKET_SECRET must be set in production');
  }
  return 'dev-only-ticket-secret';
}

/** Generate a secure signed token for a ticket */
export function generateTicketToken(ticketId: string, eventId: string, userId: string): string {
  const payload    = `${ticketId}:${eventId}:${userId}:${Date.now()}`;
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig        = createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

/** Verify a ticket token — returns decoded payload or null if invalid */
export function verifyTicketToken(token: string): {
  ticketId: string;
  eventId:  string;
  userId:   string;
  issuedAt: number;
} | null {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

    const expected = Buffer.from(createHmac('sha256', getSecret()).update(payloadB64).digest('base64url'));
    const given    = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

    const [ticketId, eventId, userId, issuedAtStr] = Buffer.from(payloadB64, 'base64url')
      .toString()
      .split(':');

    if (!ticketId || !eventId || !userId) return null;

    return { ticketId, eventId, userId, issuedAt: parseInt(issuedAtStr, 10) };
  } catch {
    return null;
  }
}

/** Generate a random invite code (8 char uppercase alphanum) */
export function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/** What the QR code contains: a link that also works if scanned with a phone camera. */
export function ticketQrPayload(token: string): string {
  return `${siteUrl()}/tickets/scan?t=${encodeURIComponent(token)}`;
}

/** Pull the ticket token back out of a scanned QR (URL form or a bare token). */
export function tokenFromScan(scanned: string): string {
  const text = scanned.trim();
  try {
    const t = new URL(text).searchParams.get('t');
    if (t) return t;
  } catch { /* not a URL: treat as a bare token */ }
  return text;
}

/**
 * QR image for emails, served by our own /api/qr route. The ticket token is
 * never sent to a third-party QR service.
 */
export function qrImageUrl(token: string): string {
  return `${siteUrl()}/api/qr?t=${encodeURIComponent(token)}`;
}

/** Inline SVG QR (gold on black) for showing a ticket on screen. */
export async function ticketQrSvg(token: string): Promise<string> {
  return QRCode.toString(ticketQrPayload(token), {
    type: 'svg', margin: 1, errorCorrectionLevel: 'M',
    color: { dark: '#C9A84C', light: '#080808' },
  });
}

/** PNG QR for email clients (which don't render inline SVG reliably). */
export async function ticketQrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(ticketQrPayload(token), {
    type: 'png', margin: 2, width: 400, errorCorrectionLevel: 'M',
    color: { dark: '#C9A84C', light: '#080808' },
  });
}
