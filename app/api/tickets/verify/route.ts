import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient }         from '@/lib/supabase';
import { verifyTicketToken }         from '@/lib/qr';
import { rateLimit, clientId }       from '@/lib/fraud';

/**
 * QR scanner endpoint — called by the admin ticket scanner app.
 * POST /api/tickets/verify  { token: string, eventId: string }
 *
 * Returns:
 *   { valid: true,  ticket: {...}, member: {...} }
 *   { valid: false, reason: string }
 */
export async function POST(req: NextRequest) {
  // Rate limit: 120 scans per minute per scanner IP
  const rl = rateLimit(`scan:${clientId(req)}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ valid: false, reason: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.token || !body?.eventId) {
    return NextResponse.json({ valid: false, reason: 'Missing token or eventId' }, { status: 400 });
  }

  // Verify cryptographic signature
  const decoded = verifyTicketToken(body.token);
  if (!decoded) {
    return NextResponse.json({ valid: false, reason: 'Invalid token signature' });
  }

  // Cross-check event ID
  if (decoded.eventId !== body.eventId) {
    return NextResponse.json({ valid: false, reason: 'Token is for a different event' });
  }

  const admin = createAdminClient();

  // Load ticket from DB
  const { data: ticket } = await admin
    .from('tickets')
    .select(`
      id, status, payment_status, qr_token, used_at,
      user_id,
      events (id, title, date)
    `)
    .eq('id', decoded.ticketId)
    .single();

  if (!ticket) {
    return NextResponse.json({ valid: false, reason: 'Ticket not found' });
  }

  // Confirm token matches stored token
  if (ticket.qr_token !== body.token) {
    return NextResponse.json({ valid: false, reason: 'Token mismatch' });
  }

  if (ticket.payment_status !== 'paid') {
    return NextResponse.json({ valid: false, reason: 'Payment not confirmed' });
  }

  if (ticket.status === 'used') {
    return NextResponse.json({
      valid:    false,
      reason:   'Ticket already scanned',
      usedAt:   ticket.used_at,
    });
  }

  if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
    return NextResponse.json({ valid: false, reason: `Ticket is ${ticket.status}` });
  }

  // Mark as used
  await admin
    .from('tickets')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', ticket.id);

  // Load member info for display
  const { data: member } = await admin
    .from('members')
    .select('username, tier')
    .eq('id', ticket.user_id)
    .single();

  return NextResponse.json({
    valid:  true,
    ticket: {
      id:        ticket.id,
      event:     ticket.events,
    },
    member: {
      username: member?.username || 'Unknown',
      tier:     member?.tier     || 'machine',
    },
  });
}
