import { NextRequest, NextResponse } from 'next/server';
import { getClerkUserId }            from '@/lib/auth';
import { createAdminClient }         from '@/lib/supabase';
import { generateTicketToken }       from '@/lib/qr';
import { rateLimit, clientId, isDuplicateTicket, hasMembershipAccess } from '@/lib/fraud';
import { ticketConfirmationEmail }   from '@/lib/email-templates';
import { Resend }                    from 'resend';
import { z }                         from 'zod';
import { verifyPaystackTicketPayment, verifyStripeTicketPayment } from '@/lib/payment-verification';

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

const PurchaseSchema = z.object({
  eventId:         z.string().uuid(),
  paymentRef:      z.string().min(1).max(200),  // Paystack ref or Stripe Checkout Session ID; ignored for free events
  paymentProvider: z.enum(['stripe', 'paystack']),
});

export async function POST(req: NextRequest) {
  // Auth
  const userId = getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 purchases per 10 min per IP
  const rl = await rateLimit(`ticket:${clientId(req)}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  // Validate body
  const body = await req.json().catch(() => null);
  const parsed = PurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { eventId, paymentProvider } = parsed.data;

  const admin = createAdminClient();

  // Load member first: every later check is keyed on the member's UUID
  const { data: member } = await admin
    .from('members')
    .select('id, username, email, tier')
    .eq('clerk_id', userId)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
  }

  // Load event
  const { data: event, error: eventErr } = await admin
    .from('events')
    .select('id, title, date, venue, min_tier, capacity, sold, is_active, price_ngn, price_usd')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (!event.is_active || new Date(event.date) < new Date()) {
    return NextResponse.json({ error: 'Event is not on sale' }, { status: 400 });
  }
  if (event.sold >= event.capacity) {
    return NextResponse.json({ error: 'Sold out' }, { status: 409 });
  }

  // Tier check
  if (event.min_tier) {
    const hasAccess = await hasMembershipAccess(member.id, event.min_tier);
    if (!hasAccess) {
      return NextResponse.json({ error: `Requires ${event.min_tier} membership or higher` }, { status: 403 });
    }
  }

  // Duplicate check
  if (await isDuplicateTicket(member.id, eventId)) {
    return NextResponse.json({ error: 'You already have a ticket for this event' }, { status: 409 });
  }

  // Verify the payment with the provider. Free events need no payment.
  const priceNGN = Number(event.price_ngn ?? 0);
  const priceUSD = Number(event.price_usd ?? 0);
  const isFree   = priceNGN === 0 && priceUSD === 0;
  const paymentRef = isFree ? `free:${eventId}:${member.id}` : parsed.data.paymentRef;

  if (!isFree) {
    const { count: refUsed } = await admin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('payment_ref', paymentRef);
    if ((refUsed ?? 0) > 0) {
      return NextResponse.json({ error: 'This payment has already been used' }, { status: 409 });
    }

    const expected = { ref: paymentRef, eventId, memberId: member.id, memberEmail: member.email, priceNGN, priceUSD };
    const check = paymentProvider === 'paystack'
      ? await verifyPaystackTicketPayment(expected)
      : await verifyStripeTicketPayment(expected);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 402 });
    }
  }

  // Reserve the seat atomically (fails if the last seat just went)
  const { error: seatErr } = await admin.rpc('increment_event_sold', { event_id: eventId, amount: 1 });
  if (seatErr) {
    console.error('Seat reservation failed after verified payment', { eventId, paymentRef, memberId: member.id });
    return NextResponse.json({ error: 'Sold out. Contact support for a refund.' }, { status: 409 });
  }

  // Create ticket
  const { data: ticket, error: ticketErr } = await admin
    .from('tickets')
    .insert({
      event_id:         eventId,
      user_id:          member.id,
      payment_ref:      paymentRef,
      payment_provider: isFree ? null : paymentProvider,
      payment_status:   'paid',
      status:           'valid',
    })
    .select()
    .single();

  if (ticketErr || !ticket) {
    // Give the seat back
    await admin.rpc('increment_event_sold', { event_id: eventId, amount: -1 });
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }

  // Generate QR token
  const token = generateTicketToken(ticket.id, eventId, member.id);

  await admin
    .from('tickets')
    .update({ qr_token: token })
    .eq('id', ticket.id);

  // Send confirmation email (a mail failure must not lose the ticket)
  if (member.email) {
    const { subject, html } = ticketConfirmationEmail({
      memberName: member.username || 'Member',
      eventTitle: event.title,
      eventDate:  new Date(event.date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }),
      eventVenue: event.venue || 'TBA',
      ticketId:   ticket.id,
      token,
      tier:       member.tier,
    });

    await getResend().emails.send({
      from:    'Inner Circle <tickets@innercirclebyod.com>',
      to:      [member.email],
      subject,
      html,
    }).catch(err => console.error('Ticket email failed', err));
  }

  // Award points for ticket purchase
  await admin.rpc('update_member_points', { member_id: member.id, points_delta: 100 });

  return NextResponse.json({
    success: true,
    ticketId: ticket.id,
    token,
  });
}

export async function GET(req: NextRequest) {
  const userId = getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!member) {
    return NextResponse.json({ tickets: [] });
  }

  const { data: tickets } = await admin
    .from('tickets')
    .select(`
      id, status, payment_status, created_at,
      events (id, title, date, venue, location)
    `)
    .eq('user_id', member.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ tickets: tickets ?? [] });
}
