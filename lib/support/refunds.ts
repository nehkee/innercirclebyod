/**
 * Cancellations and refunds.
 *
 * Policy: before a refund we offer a new date or a discount. If the member
 * still wants their money back, a refund request is opened and the team
 * processes it within RETENTION.refundDays (7) days.
 */
import { createAdminClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { getMembership } from '@/lib/membership';
import { RETENTION } from '@/lib/support/config';

const DAY = 86_400_000;

// ─── Membership cancellation ────────────────────────────────────────────────────

/** Stop renewal at the end of the paid period. Access continues until then. */
export async function cancelMembershipAtPeriodEnd(memberId: string): Promise<string> {
  const m = await getMembership(memberId);
  if (!m || m.status !== 'active') return "You don't have an active membership to cancel.";

  if (m.stripe_sub_id && m.payment_provider === 'stripe') {
    await getStripe().subscriptions.update(m.stripe_sub_id, { cancel_at_period_end: true });
  }
  await createAdminClient().from('memberships').update({ cancel_at_period_end: true }).eq('user_id', memberId);

  const end = m.current_period_end ? new Date(m.current_period_end).toDateString() : 'the end of your current period';
  return m.stripe_sub_id
    ? `Done. Your membership won't renew, and you keep full access until ${end}.`
    : `Done. Your pass runs until ${end} and won't be renewed.`;
}

/** Undo a pending cancellation. */
export async function resumeMembership(memberId: string): Promise<string> {
  const m = await getMembership(memberId);
  if (!m) return 'No membership found.';
  if (m.stripe_sub_id && m.payment_provider === 'stripe') {
    await getStripe().subscriptions.update(m.stripe_sub_id, { cancel_at_period_end: false });
  }
  await createAdminClient().from('memberships').update({ cancel_at_period_end: false }).eq('user_id', memberId);
  return 'Welcome back — your membership will keep renewing as normal.';
}

// ─── Refund requests ────────────────────────────────────────────────────────────

/** The most recent fulfilled membership payment, for a membership refund. */
export async function latestMembershipPayment(memberId: string) {
  const { data } = await createAdminClient()
    .from('payments')
    .select('id, amount, currency, provider, status')
    .eq('member_id', memberId)
    .eq('kind', 'membership')
    .eq('status', 'fulfilled')
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function openRefundRequest(params: {
  memberId:  string;
  threadId:  string;
  paymentId: string;
  ticketId?: string | null;
  kind:      'ticket' | 'membership';
  reason?:   string | null;
  cryptoAddress?: string | null;
}): Promise<{ dueAt: Date; alreadyOpen: boolean }> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('refund_requests')
    .select('due_at')
    .eq('payment_id', params.paymentId)
    .eq('status', 'requested')
    .maybeSingle();
  if (existing) return { dueAt: new Date(existing.due_at), alreadyOpen: true };

  const { data: payment } = await admin
    .from('payments')
    .select('amount, currency, provider')
    .eq('id', params.paymentId)
    .single();
  if (!payment) throw new Error('Payment not found');

  const dueAt = new Date(Date.now() + RETENTION.refundDays * DAY);
  const { error } = await admin.from('refund_requests').insert({
    member_id:      params.memberId,
    thread_id:      params.threadId,
    payment_id:     params.paymentId,
    ticket_id:      params.ticketId ?? null,
    kind:           params.kind,
    amount:         payment.amount,
    currency:       payment.currency,
    provider:       payment.provider,
    reason:         params.reason ?? null,
    crypto_address: params.cryptoAddress ?? null,
    due_at:         dueAt.toISOString(),
  });
  if (error) throw new Error(`Could not open refund request: ${error.message}`);
  return { dueAt, alreadyOpen: false };
}

/**
 * Team action: send the money back through the original provider, then
 * void the ticket or end the membership. Crypto refunds are sent by hand from
 * the NOWPayments dashboard to the address the member gave, then marked here.
 */
export async function executeRefund(requestId: string, adminMemberId: string, opts: { manualConfirm?: boolean } = {}): Promise<string> {
  const admin = createAdminClient();
  const { data: req } = await admin
    .from('refund_requests')
    .select('*, payments (id, kind, provider, provider_ref, provider_payment_id, amount, currency, member_id)')
    .eq('id', requestId)
    .single();
  if (!req) throw new Error('Refund request not found');
  if (req.status !== 'requested') throw new Error(`Request is already ${req.status}`);

  const payment = Array.isArray(req.payments) ? req.payments[0] : req.payments;
  if (!payment) throw new Error('Payment not found');

  try {
    if (payment.provider === 'stripe') {
      await refundStripe(payment, req.kind);
    } else if (payment.provider === 'paystack') {
      await refundPaystack(payment.provider_payment_id);
    } else if (payment.provider === 'crypto') {
      if (!opts.manualConfirm) {
        throw new Error('Crypto refunds are sent manually. Send the funds, then use "Mark as refunded".');
      }
    } else {
      throw new Error('This payment has no provider to refund (free ticket).');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.startsWith('Crypto refunds are sent manually')) {
      await admin.from('refund_requests').update({ status: 'failed', note: msg.slice(0, 500) }).eq('id', requestId);
    }
    throw err;
  }

  // Undo what was bought
  if (req.kind === 'ticket' && req.ticket_id) {
    const { data: t } = await admin
      .from('tickets')
      .update({ status: 'refunded', payment_status: 'refunded' })
      .eq('id', req.ticket_id)
      .neq('status', 'refunded')
      .select('event_id');
    if (t?.[0]) await admin.rpc('increment_event_sold', { event_id: t[0].event_id, amount: -1 });
  } else if (req.kind === 'membership') {
    await admin.from('memberships').update({ status: 'cancelled' }).eq('user_id', req.member_id);
  }

  await admin.from('payments').update({ status: 'refunded' }).eq('id', payment.id);
  await admin
    .from('refund_requests')
    .update({ status: 'refunded', processed_by: adminMemberId, processed_at: new Date().toISOString() })
    .eq('id', requestId);

  return `Refunded ${payment.currency === 'NGN' ? '₦' : '$'}${Number(payment.amount).toLocaleString()} via ${payment.provider}.`;
}

export async function declineRefund(requestId: string, adminMemberId: string, note: string) {
  await createAdminClient()
    .from('refund_requests')
    .update({ status: 'declined', note, processed_by: adminMemberId, processed_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'requested');
}

/** Member withdrew the request (e.g. accepted a new date instead). */
export async function withdrawRefund(paymentId: string) {
  await createAdminClient()
    .from('refund_requests')
    .update({ status: 'withdrawn' })
    .eq('payment_id', paymentId)
    .eq('status', 'requested');
}

async function refundStripe(
  payment: { provider_payment_id: string | null; provider_ref: string | null },
  kind: 'ticket' | 'membership'
) {
  const stripe = getStripe();
  const ref = payment.provider_payment_id;
  if (!ref) throw new Error('No Stripe payment reference');

  if (ref.startsWith('sub_')) {
    // Membership subscription: refund the latest invoice and end the subscription now
    const sub = await stripe.subscriptions.retrieve(ref, { expand: ['latest_invoice'] });
    const invoice = sub.latest_invoice as { payment_intent?: string | { id: string } | null } | null;
    const pi = typeof invoice?.payment_intent === 'string' ? invoice.payment_intent : invoice?.payment_intent?.id;
    if (!pi) throw new Error('No paid invoice to refund');
    await stripe.refunds.create({ payment_intent: pi });
    await stripe.subscriptions.cancel(ref);
  } else {
    await stripe.refunds.create({ payment_intent: ref });
  }
  void kind;
}

async function refundPaystack(transactionId: string | null) {
  if (!transactionId) throw new Error('No Paystack transaction reference');
  const res = await fetch('https://api.paystack.co/refund', {
    method:  'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ transaction: transactionId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status === false) {
    throw new Error(`Paystack refund failed: ${body?.message ?? res.status}`);
  }
}
