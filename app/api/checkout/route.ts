import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMember, getClerkUserId } from '@/lib/auth';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { rateLimit } from '@/lib/fraud';
import { TIERS } from '@/lib/constants';
import { hasTierAccess } from '@/lib/membership';
import { getStripe } from '@/lib/stripe';
import { initializePaystackTransaction } from '@/lib/paystack';
import { createInvoice } from '@/lib/payments/nowpayments';
import { completePayment } from '@/lib/payments/fulfill';
import { appUrl, enabledPaymentMethods } from '@/lib/payments/config';
import type { MembershipTier } from '@/types';
import { findUsableDiscount } from '@/lib/support/offers';
import { getDropRow, checkDropPassword } from '@/lib/drops';
import { reportError } from '@/lib/alerts';

const Body = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('membership'), tier: z.enum(['initiate', 'insider', 'vanguard', 'sovereign']), method: z.enum(['card', 'paystack', 'crypto']) }),
  z.object({ kind: z.literal('ticket'), eventId: z.string().uuid(), method: z.enum(['card', 'paystack', 'crypto', 'free']) }),
  z.object({ kind: z.literal('drop'), dropId: z.string().uuid(), method: z.enum(['card', 'paystack', 'crypto']), password: z.string().max(100).optional() }),
]);

const PROVIDER = { card: 'stripe', paystack: 'paystack', crypto: 'crypto' } as const;

function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

/**
 * Start a checkout. Returns { url } to send the customer to: the provider's
 * hosted payment page, or straight to the success page for free tickets.
 */
export async function POST(req: NextRequest) {
  if (!(await getClerkUserId())) return fail('Sign in to continue', 401, { signIn: true });
  if (!isSupabaseConfigured()) return fail('Checkout is not available yet', 503);

  const member = await getCurrentMember();
  if (!member) return fail('Your account is still being set up. Try again in a moment.', 409);

  const rl = await rateLimit(`checkout:${member.id}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return fail('Too many checkout attempts. Try again in a few minutes.', 429);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('Invalid request', 400);
  const body = parsed.data;

  const methods = enabledPaymentMethods();
  if (body.method !== 'free' && !methods[body.method]) return fail('That payment method is not available', 400);

  const admin = createAdminClient();
  const base  = appUrl(req.nextUrl.origin);

  // ── Work out what is being bought and its price ─────────────────────────────
  let description: string;
  let priceUSD: number;
  let priceNGN: number;
  let cancelPath: string;
  let tier: MembershipTier | null = null;
  let eventId: string | null = null;
  let dropId: string | null = null;

  if (body.kind === 'membership') {
    // Invitation-only mode: new members need an invite or waitlist approval
    if (process.env.NEXT_PUBLIC_INVITE_ONLY === 'true' && !member.access_granted && !member.is_admin) {
      const { count } = await admin.from('memberships').select('id', { count: 'exact', head: true }).eq('user_id', member.id);
      if (!count) return fail('Inner Circle is invitation-only. Enter your invite code to continue.', 403, { inviteRequired: true });
    }
    const cfg = TIERS.find(t => t.id === body.tier)!;
    tier        = cfg.id;
    priceUSD    = cfg.priceUSD;
    priceNGN    = cfg.priceNGN;
    description = `Inner Circle ${cfg.name} membership`;
    cancelPath  = '/membership';

    // Don't stack a second plan on top of a live card subscription
    const { data: current } = await admin
      .from('memberships')
      .select('status, stripe_sub_id, current_period_end')
      .eq('user_id', member.id)
      .maybeSingle();
    if (current?.status === 'active' && current.stripe_sub_id &&
        (!current.current_period_end || new Date(current.current_period_end) > new Date())) {
      return fail('You already have an auto-renewing card membership. Contact support to change it.', 409);
    }
  } else if (body.kind === 'ticket') {
    const { data: event } = await admin
      .from('events')
      .select('id, title, date, capacity, sold, is_active, min_tier, price_usd, price_ngn')
      .eq('id', body.eventId)
      .maybeSingle();

    if (!event || !event.is_active)            return fail('Event not found', 404);
    if (new Date(event.date) < new Date())     return fail('This event has ended', 400);
    if (event.sold >= event.capacity)          return fail('Sold out', 409);
    if (event.min_tier && !(await hasTierAccess(member.id, event.min_tier))) {
      return fail(`This event is for ${String(event.min_tier).toUpperCase()}+ members`, 403);
    }

    const { count } = await admin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('user_id', member.id)
      .neq('status', 'cancelled');
    if ((count ?? 0) > 0) return fail('You already have a ticket for this event', 409);

    eventId     = event.id;
    priceUSD    = Number(event.price_usd);
    priceNGN    = Number(event.price_ngn);
    description = `Ticket: ${event.title}`;
    cancelPath  = `/events/${event.id}`;
  } else {
    // ── Drop ──
    const drop = await getDropRow(body.dropId);
    const now = Date.now();
    if (!drop || !drop.is_active)                         return fail('Drop not found', 404);
    if (new Date(drop.drop_date).getTime() > now)         return fail("This drop isn't live yet", 400);
    if (drop.ends_at && new Date(drop.ends_at).getTime() < now) return fail('This drop has ended', 400);
    if (drop.sold >= drop.quantity)                       return fail('Sold out', 409);
    if (drop.is_password_protected && !checkDropPassword(drop.id, body.password ?? '', drop.password_hash)) {
      return fail('Wrong password', 403);
    }
    if (drop.min_tier && !(await hasTierAccess(member.id, drop.min_tier))) {
      return fail(`This drop is for ${String(drop.min_tier).toUpperCase()}+ members`, 403);
    }
    const { count } = await admin
      .from('drop_orders')
      .select('id', { count: 'exact', head: true })
      .eq('drop_id', drop.id)
      .eq('member_id', member.id)
      .eq('status', 'completed');
    if ((count ?? 0) > 0) return fail('You already secured this drop — one per member', 409);

    dropId      = drop.id;
    priceUSD    = Number(drop.price_usd);
    priceNGN    = Number(drop.price_ngn);
    description = `Drop: ${drop.name}`;
    cancelPath  = '/drops';
  }

  const isFree = body.kind === 'ticket' && priceUSD === 0 && priceNGN === 0;
  if (isFree !== (body.method === 'free')) {
    return fail(isFree ? 'This event is free — no payment needed' : 'Choose a payment method', 400);
  }

  const currency  = body.method === 'paystack' ? 'NGN' : 'USD';
  const listPrice = currency === 'NGN' ? priceNGN : priceUSD;
  if (!isFree && !(listPrice > 0)) return fail('This item has no price in that currency', 400);

  // Apply a saved retention discount automatically (consumed only once paid)
  const discount = isFree ? null
    : body.kind === 'drop' ? null  // retention discounts cover events and membership, not limited drops
    : await findUsableDiscount(member.id, body.kind === 'ticket' ? 'event_discount' : 'membership_discount');
  const amount = discount ? Math.round(listPrice * (100 - discount.percent)) / 100 : listPrice;

  // ── Record the pending payment first, so webhooks always find it ────────────
  const { data: payment, error: insertErr } = await admin
    .from('payments')
    .insert({
      member_id: member.id,
      kind:      body.kind,
      tier,
      event_id:  eventId,
      drop_id:   dropId,
      provider:  body.method === 'free' ? null : PROVIDER[body.method],
      currency,
      amount:           isFree ? 0 : amount,
      offer_id:         discount?.id ?? null,
      discount_percent: discount?.percent ?? 0,
    })
    .select('id')
    .single();
  if (insertErr || !payment) return fail('Could not start checkout', 500);

  const successUrl = `${base}/checkout/success?payment=${payment.id}`;
  const cancelUrl  = `${base}${cancelPath}?checkout=cancelled`;

  try {
    let url: string;
    let providerRef: string | null = null;

    if (body.method === 'free') {
      await completePayment(payment.id);
      url = successUrl;
    } else if (body.method === 'card') {
      const isMembership = body.kind === 'membership';
      const stripe = getStripe();
      const coupon = isMembership && discount
        ? await stripe.coupons.create({ percent_off: discount.percent, duration: 'once', name: `Member discount ${discount.percent}%` })
        : null;
      const session = await stripe.checkout.sessions.create({
        mode:                isMembership ? 'subscription' : 'payment',
        customer_email:      member.email,
        client_reference_id: payment.id,
        line_items: [{
          quantity: 1,
          price_data: {
            currency:     'usd',
            unit_amount:  Math.round((isMembership ? listPrice : amount) * 100),
            product_data: { name: description },
            ...(isMembership ? { recurring: { interval: 'month' as const } } : {}),
          },
        }],
        metadata: { paymentId: payment.id },
        ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
        ...(isMembership ? { subscription_data: { metadata: { paymentId: payment.id, userId: member.id } } } : {}),
        success_url: successUrl,
        cancel_url:  cancelUrl,
      });
      url = session.url!;
      providerRef = session.id;
    } else if (body.method === 'paystack') {
      providerRef = `ic_${payment.id.replace(/-/g, '')}`;
      const res = await initializePaystackTransaction({
        email:       member.email,
        amount:      Math.round(amount * 100), // kobo
        reference:   providerRef,
        metadata:    { paymentId: payment.id, kind: body.kind },
        callbackUrl: successUrl,
      });
      url = res.data.authorization_url;
    } else {
      const invoice = await createInvoice({
        priceUSD:    amount,
        orderId:     payment.id,
        description,
        ipnUrl:      `${base}/api/webhooks/nowpayments`,
        successUrl,
        cancelUrl,
      });
      url = invoice.invoice_url;
      providerRef = invoice.id;
    }

    if (providerRef) await admin.from('payments').update({ provider_ref: providerRef }).eq('id', payment.id);
    return NextResponse.json({ url, paymentId: payment.id });
  } catch (err) {
    await reportError('Checkout provider error', err, { method: body.method, kind: body.kind });
    await admin
      .from('payments')
      .update({ status: 'failed', failure_reason: 'Could not reach payment provider' })
      .eq('id', payment.id)
      .eq('status', 'pending');
    return fail('The payment provider is unavailable. Please try again.', 502);
  }
}
