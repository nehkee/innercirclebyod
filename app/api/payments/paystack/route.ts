import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, quantity, email, amount } = body;

    if (!eventId || !quantity || !email || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack uses kobo
        currency: 'NGN',
        reference: `IC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/verify`,
        metadata: {
          event_id:  eventId,
          quantity:  quantity,
          cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Paystack initialization failed');
    }

    const data = await response.json();

    return NextResponse.json({
      checkoutUrl:  data.data.authorization_url,
      reference:    data.data.reference,
      accessCode:   data.data.access_code,
    });
  } catch {
    return NextResponse.json({ error: 'Paystack checkout failed' }, { status: 500 });
  }
}

// Paystack webhook
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature
    // const hash = crypto
    //   .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    //   .update(JSON.stringify(body))
    //   .digest('hex');
    //
    // if (hash !== req.headers.get('x-paystack-signature')) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    // }

    if (body.event === 'charge.success') {
      const { reference, metadata } = body.data;
      const { event_id, quantity } = metadata;

      // Issue ticket + update event sold count
      // await issueTicket({ eventId: event_id, quantity, reference });
      // await supabase.rpc('increment_event_sold', { event_id, amount: quantity });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
