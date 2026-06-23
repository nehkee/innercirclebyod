import { NextRequest, NextResponse } from 'next/server';
import Stripe                        from 'stripe';
import { stripe }                    from '@/lib/stripe';
import { createAdminClient }         from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig     = req.headers.get('stripe-signature') ?? '';
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid stripe signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId  = session.metadata?.userId;
      const tier    = session.metadata?.tier;

      if (!userId || !tier) break;

      await admin
        .from('memberships')
        .upsert({
          user_id:            userId,
          tier,
          status:             'active',
          stripe_customer_id: session.customer as string,
          stripe_sub_id:      session.subscription as string,
          payment_provider:   'stripe',
          current_period_end: null,
        }, { onConflict: 'user_id' });

      await admin
        .from('members')
        .update({ tier })
        .eq('id', userId);

      await admin.rpc('update_member_points', { member_id: userId, points_delta: 200 });
      break;
    }

    case 'customer.subscription.updated': {
      const sub     = event.data.object as Stripe.Subscription;
      const userId  = sub.metadata?.userId;
      if (!userId) break;

      const status = sub.status === 'active' ? 'active'
                   : sub.status === 'past_due' ? 'past_due'
                   : 'inactive';

      await admin
        .from('memberships')
        .update({
          status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_sub_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await admin
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('stripe_sub_id', sub.id);

      // Downgrade member to machine tier
      const userId = sub.metadata?.userId;
      if (userId) {
        await admin.from('members').update({ tier: 'machine' }).eq('id', userId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await admin
        .from('memberships')
        .update({ status: 'past_due' })
        .eq('stripe_sub_id', invoice.subscription as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
