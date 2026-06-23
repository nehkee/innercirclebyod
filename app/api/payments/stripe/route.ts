import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, quantity, userId, email } = body;

    if (!eventId || !quantity || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TODO: Look up event from Supabase
    // const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();
    // if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Check availability
    // if (event.capacity - event.sold < quantity) {
    //   return NextResponse.json({ error: 'Not enough tickets available' }, { status: 409 });
    // }

    // Create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'payment',
    //   customer_email: email,
    //   line_items: [{
    //     price_data: {
    //       currency: 'usd',
    //       unit_amount: event.priceUSD * 100,
    //       product_data: {
    //         name: event.title,
    //         description: event.description,
    //       },
    //     },
    //     quantity,
    //   }],
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}`,
    //   metadata: { eventId, userId, quantity: String(quantity) },
    // });
    //
    // return NextResponse.json({ checkoutUrl: session.url });

    return NextResponse.json({ checkoutUrl: 'https://checkout.stripe.com/test-ticket' });
  } catch {
    return NextResponse.json({ error: 'Stripe checkout failed' }, { status: 500 });
  }
}

// Stripe webhook handler
export async function PUT(req: NextRequest) {
  try {
    const body      = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

    // switch (event.type) {
    //   case 'checkout.session.completed': {
    //     const session = event.data.object;
    //     const { eventId, userId, quantity } = session.metadata;
    //
    //     // Issue ticket
    //     await issueTicket({ eventId, userId, quantity: Number(quantity), sessionId: session.id });
    //
    //     // Send ticket email
    //     await sendTicketEmail({ email: session.customer_email, eventId, ticketId });
    //     break;
    //   }
    //   case 'customer.subscription.created':
    //   case 'customer.subscription.updated':
    //     await updateMembership(event.data.object);
    //     break;
    // }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
