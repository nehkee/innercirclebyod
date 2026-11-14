/**
 * Turn a verified payment into what was bought — exactly once.
 *
 * Both the provider webhook and the customer's return to the success page may
 * call completePayment() for the same payment, possibly at the same moment.
 * The first caller atomically moves the row from 'pending' to 'processing'
 * and does the work; every other caller sees it's taken and does nothing.
 */
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { generateTicketToken } from '@/lib/qr';
import { ticketConfirmationEmail } from '@/lib/email-templates';
import { ONE_TIME_MEMBERSHIP_DAYS } from '@/lib/payments/config';
import type { PaymentRow, Verified } from '@/lib/payments/types';

type VerifiedOk = Extract<Verified, { ok: true }>;

export type CompleteResult = 'fulfilled' | 'already_handled' | 'needs_attention';

export async function completePayment(paymentId: string, info: VerifiedOk = { ok: true }): Promise<CompleteResult> {
  const admin = createAdminClient();

  const { data: claimed } = await admin
    .from('payments')
    .update({
      status:              'processing',
      paid_at:             new Date().toISOString(),
      provider_payment_id: info.providerPaymentId ?? null,
      failure_reason:      null,
    })
    .eq('id', paymentId)
    .eq('status', 'pending')
    .select('*');

  const payment = claimed?.[0] as PaymentRow | undefined;
  if (!payment) return 'already_handled';

  try {
    if (payment.kind === 'ticket') await fulfillTicket(payment);
    else                           await fulfillMembership(payment, info);

    await admin
      .from('payments')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', payment.id);
    return 'fulfilled';
  } catch (err) {
    // Money was taken but delivery failed (e.g. last seat went): flag for a human / refund.
    const reason = err instanceof Error ? err.message : String(err);
    console.error('Payment fulfilment failed', { paymentId, reason });
    await admin
      .from('payments')
      .update({ status: 'needs_attention', failure_reason: reason.slice(0, 500) })
      .eq('id', payment.id);
    return 'needs_attention';
  }
}

/** Mark a payment as failed/expired (only while still pending). */
export async function closePayment(paymentId: string, status: 'failed' | 'expired', reason: string) {
  await createAdminClient()
    .from('payments')
    .update({ status, failure_reason: reason })
    .eq('id', paymentId)
    .eq('status', 'pending');
}

/** Note why a payment is still pending (e.g. crypto partially paid) without closing it. */
export async function notePending(paymentId: string, reason: string) {
  await createAdminClient()
    .from('payments')
    .update({ failure_reason: reason })
    .eq('id', paymentId)
    .eq('status', 'pending');
}

// ─── Tickets ────────────────────────────────────────────────────────────────────

async function fulfillTicket(payment: PaymentRow) {
  const admin = createAdminClient();
  const eventId = payment.event_id!;

  const [{ data: member }, { data: event }] = await Promise.all([
    admin.from('members').select('id, username, email, tier').eq('id', payment.member_id).single(),
    admin.from('events').select('id, title, date, venue').eq('id', eventId).single(),
  ]);
  if (!member || !event) throw new Error('Member or event missing');

  // Reserve the seat atomically (raises if sold out)
  const { error: seatErr } = await admin.rpc('increment_event_sold', { event_id: eventId, amount: 1 });
  if (seatErr) throw new Error('Sold out after payment — refund required');

  const { data: ticket, error: ticketErr } = await admin
    .from('tickets')
    .insert({
      event_id:         eventId,
      user_id:          member.id,
      payment_ref:      payment.id,
      payment_provider: payment.provider,
      payment_status:   'paid',
      status:           'valid',
    })
    .select('id')
    .single();

  if (ticketErr || !ticket) {
    await admin.rpc('increment_event_sold', { event_id: eventId, amount: -1 });
    throw new Error(
      ticketErr?.code === '23505'
        ? 'Member already holds a ticket for this event — refund required'
        : `Could not create ticket: ${ticketErr?.message ?? 'unknown error'}`
    );
  }

  const token = generateTicketToken(ticket.id, eventId, member.id);
  await admin.from('tickets').update({ qr_token: token }).eq('id', ticket.id);
  await admin.rpc('update_member_points', { member_id: member.id, points_delta: 100, reason: 'ticket' });

  if (member.email && process.env.RESEND_API_KEY) {
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
    await new Resend(process.env.RESEND_API_KEY).emails
      .send({ from: 'Inner Circle <tickets@innercirclebyod.com>', to: [member.email], subject, html })
      .catch(err => console.error('Ticket email failed', err));
  }
}

// ─── Memberships ────────────────────────────────────────────────────────────────

async function fulfillMembership(payment: PaymentRow, info: VerifiedOk) {
  const admin = createAdminClient();
  const tier  = payment.tier!;

  const { data: existing } = await admin
    .from('memberships')
    .select('tier, status, current_period_end')
    .eq('user_id', payment.member_id)
    .maybeSingle();

  let periodEnd: Date;
  if (payment.provider === 'stripe' && info.stripeSubscriptionId) {
    // Auto-renewing card subscription: Stripe owns the billing period
    const sub = await getStripe().subscriptions.retrieve(info.stripeSubscriptionId);
    periodEnd = new Date(sub.current_period_end * 1000);
  } else {
    // One-time pass: renewing the same tier stacks onto remaining time
    const now = new Date();
    const currentEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
    const stack = existing?.status === 'active' && existing.tier === tier && currentEnd && currentEnd > now;
    periodEnd = new Date((stack ? currentEnd! : now).getTime() + ONE_TIME_MEMBERSHIP_DAYS * 86_400_000);
  }

  const { error } = await admin.from('memberships').upsert(
    {
      user_id:            payment.member_id,
      tier,
      status:             'active',
      payment_provider:   payment.provider,
      stripe_customer_id: info.stripeCustomerId ?? null,
      stripe_sub_id:      info.stripeSubscriptionId ?? null,
      last_payment_ref:   payment.id,
      current_period_end: periodEnd.toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(`Could not save membership: ${error.message}`);

  await admin.from('members').update({ tier }).eq('id', payment.member_id);
  await admin.rpc('update_member_points', { member_id: payment.member_id, points_delta: 200, reason: 'membership' });
}
