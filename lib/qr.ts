import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

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

/** QR code image URL for embedding in emails (uses free QR API) */
export function qrImageUrl(token: string, size = 200): string {
  const data = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL}/tickets/scan?t=${token}`
  );
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}&bgcolor=080808&color=C9A84C`;
}
