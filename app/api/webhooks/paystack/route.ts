import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient }         from '@/lib/supabase';
import { verifyPaystackWebhook }     from '@/lib/fraud';
import { TIER_PRICES_NGN }           from '@/lib/paystack';

interface PaystackEvent {
  event: string;
  data: {
    reference:   string;
    status:      string;
    amount:      number;
    customer:    { email: string; customer_code: string };
    metadata?:   { userId?: string; tier?: string; eventId?: string };
    plan?:       { plan_code: string };
    subscription?: { subscription_code: string; next_payment_date: string };
  };
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig     = req.headers.get('x-paystack-signature') ?? '';

  if (!verifyPaystackWebhook(payload, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event: PaystackEvent = JSON.parse(payload);
  const admin = createAdminClient();

  switch (event.event) {
    case 'charge.success': {
      const { reference, metadata, customer, amount } = event.data;
      const userId = metadata?.userId;
      const tier   = metadata?.tier;

      if (!userId || !tier) break;

      // Metadata and amount can be set by the payer in Paystack's inline checkout,
      // so only grant the tier if they actually paid its price (amount is in kobo).
      const required = TIER_PRICES_NGN[tier];
      if (!required || amount < required) {
        console.warn('Paystack charge below tier price — not upgrading', { reference, tier, amount });
        break;
      }

      await admin
        .from('memberships')
        .upsert({
          user_id:                userId,
          tier,
          status:                 'active',
          paystack_customer_code: customer.customer_code,
          payment_provider:       'paystack',
          last_payment_ref:       reference,
        }, { onConflict: 'user_id' });

      await admin
        .from('members')
        .update({ tier })
        .eq('id', userId);

      await admin.rpc('update_member_points', { member_id: userId, points_delta: 200 });
      break;
    }

    case 'subscription.create': {
      const { data } = event;
      const userId   = data.metadata?.userId;
      if (!userId || !data.subscription) break;

      await admin
        .from('memberships')
        .update({
          paystack_sub_code:  data.subscription.subscription_code,
          current_period_end: data.subscription.next_payment_date,
        })
        .eq('user_id', userId);
      break;
    }

    case 'subscription.disable': {
      const { data } = event;
      if (!data.subscription) break;

      const { data: membership } = await admin
        .from('memberships')
        .select('user_id')
        .eq('paystack_sub_code', data.subscription.subscription_code)
        .single();

      if (membership) {
        await admin
          .from('memberships')
          .update({ status: 'cancelled' })
          .eq('paystack_sub_code', data.subscription.subscription_code);
        await admin
          .from('members')
          .update({ tier: 'machine' })
          .eq('id', membership.user_id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const { data } = event;
      if (!data.subscription) break;

      await admin
        .from('memberships')
        .update({ status: 'past_due' })
        .eq('paystack_sub_code', data.subscription.subscription_code);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
