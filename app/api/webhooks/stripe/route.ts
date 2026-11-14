import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe }         from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { checkStripeSession } from '@/lib/payments/verify';
import { closePayment, completePayment } from '@/lib/payments/fulfill';
import type { PaymentRow } from '@/lib/payments/types';
import { Resend } from 'resend';
import { paymentFailedEmail } from '@/lib/email-templates';
import { fromEmail } from '@/lib/brand';

/**
 * Stripe webhook. Subscribe in the Stripe dashboard to:
 * checkout.session.completed, checkout.session.expired,
 * customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, req.headers.get('stripe-signature') ?? '', secret);
  } catch {
    return NextResponse.json({ error: 'Invalid stripe signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session   = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (!paymentId) break;

      const { data: payment } = await admin.from('payments').select('*').eq('id', paymentId).maybeSingle();
      if (!payment) break;

      const v = checkStripeSession(session, payment as PaymentRow);
      if (v.ok) await completePayment(paymentId, v);
      break;
    }

    case 'checkout.session.expired': {
      const paymentId = (event.data.object as Stripe.Checkout.Session).metadata?.paymentId;
      if (paymentId) await closePayment(paymentId, 'expired', 'Checkout expired');
      break;
    }

    // Monthly renewals and plan changes keep the paid period current
    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription;
      const status = sub.status === 'active' || sub.status === 'trialing' ? 'active'
                   : sub.status === 'past_due' ? 'past_due'
                   : 'inactive';
      await admin
        .from('memberships')
        .update({ status, current_period_end: new Date(sub.current_period_end * 1000).toISOString() })
        .eq('stripe_sub_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const { data: membership } = await admin
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('stripe_sub_id', sub.id)
        .select('user_id')
        .maybeSingle();
      if (membership) await admin.from('members').update({ tier: 'initiate' }).eq('id', membership.user_id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const { data: m } = await admin
          .from('memberships')
          .update({ status: 'past_due' })
          .eq('stripe_sub_id', invoice.subscription as string)
          .select('user_id')
          .maybeSingle();

        // Tell the member straight away so a stale card doesn't cost us a member
        if (m && process.env.RESEND_API_KEY) {
          const { data: member } = await admin.from('members').select('email, username').eq('id', m.user_id).single();
          if (member?.email) {
            const { subject, html } = paymentFailedEmail(member.username ?? 'Hey');
            await new Resend(process.env.RESEND_API_KEY).emails
              .send({ from: fromEmail(), to: [member.email], subject, html })
              .catch(err => console.error('Payment-failed email error', err));
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
