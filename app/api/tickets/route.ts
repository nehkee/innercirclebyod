import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import { createAdminClient }         from '@/lib/supabase';
import { generateTicketToken }       from '@/lib/qr';
import { rateLimit, clientId, isDuplicateTicket, hasMembershipAccess } from '@/lib/fraud';
import { ticketConfirmationEmail }   from '@/lib/email-templates';
import { Resend }                    from 'resend';
import { z }                         from 'zod';

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

const PurchaseSchema = z.object({
  eventId:         z.string().uuid(),
  paymentRef:      z.string().min(1),
  paymentProvider: z.enum(['stripe', 'paystack']),
});

export async function POST(req: NextRequest) {
  // Auth
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 purchases per 10 min per IP
  const rl = rateLimit(`ticket:${clientId(req)}`, 5, 10 * 60 * 1000);
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
  const { eventId, paymentRef, paymentProvider } = parsed.data;

  const admin = createAdminClient();

  // Load event
  const { data: event, error: eventErr } = await admin
    .from('events')
    .select('id, title, date, venue, min_tier, capacity, sold, is_active')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (!event.is_active) {
    return NextResponse.json({ error: 'Event is not active' }, { status: 400 });
  }
  if (event.sold >= event.capacity) {
    return NextResponse.json({ error: 'Sold out' }, { status: 409 });
  }

  // Tier check
  if (event.min_tier) {
    const hasAccess = await hasMembershipAccess(userId, event.min_tier);
    if (!hasAccess) {
      return NextResponse.json({ error: `Requires ${event.min_tier} membership or higher` }, { status: 403 });
    }
  }

  // Duplicate check
  if (await isDuplicateTicket(userId, eventId)) {
    return NextResponse.json({ error: 'You already have a ticket for this event' }, { status: 409 });
  }

  // Load member info
  const { data: member } = await admin
    .from('members')
    .select('id, username, email, tier')
    .eq('clerk_id', userId)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
  }

  // Create ticket
  const { data: ticket, error: ticketErr } = await admin
    .from('tickets')
    .insert({
      event_id:         eventId,
      user_id:          member.id,
      payment_ref:      paymentRef,
      payment_provider: paymentProvider,
      payment_status:   'paid',
      status:           'valid',
    })
    .select()
    .single();

  if (ticketErr || !ticket) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }

  // Increment event sold count (atomic DB function)
  await admin.rpc('increment_event_sold', { event_id: eventId });

  // Generate QR token
  const token = generateTicketToken(ticket.id, eventId, member.id);

  // Store token hash on ticket for verification
  await admin
    .from('tickets')
    .update({ qr_token: token })
    .eq('id', ticket.id);

  // Send confirmation email
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
    });
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
  const { userId } = auth();
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
