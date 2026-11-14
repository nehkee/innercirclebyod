import { NextRequest, NextResponse } from 'next/server';
import { verifyTicketToken, ticketQrPng } from '@/lib/qr';

/**
 * Ticket QR image for emails: /api/qr?t=<ticket token>.
 * Only renders genuinely signed ticket tokens, so it can't be used as a free QR service.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t') ?? '';
  if (!token || token.length > 1000 || !verifyTicketToken(token)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const png = await ticketQrPng(token);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'private, max-age=86400',
      'X-Robots-Tag':  'noindex',
    },
  });
}
