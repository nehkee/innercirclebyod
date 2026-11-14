/**
 * Keep the money in: move a ticket to another event, give it to a friend,
 * or (for free tickets) release the seat.
 */
import { createAdminClient } from '@/lib/supabase';
import { generateTicketToken } from '@/lib/qr';
import { hasTierAccess } from '@/lib/membership';
import type { MembershipTier } from '@/types';

export interface TicketContext {
  id:        string;
  user_id:   string;
  event_id:  string;
  status:    string;
  payment_ref: string | null;
  event:     { id: string; title: string; date: string; price_usd: number; price_ngn: number };
  payment:   { id: string; amount: number; currency: 'USD' | 'NGN'; provider: string | null; status: string } | null;
}

export async function loadTicket(ticketId: string, memberId: string): Promise<TicketContext | null> {
  const admin = createAdminClient();
  const { data: t } = await admin
    .from('tickets')
    .select('id, user_id, event_id, status, payment_ref, events (id, title, date, price_usd, price_ngn)')
    .eq('id', ticketId)
    .eq('user_id', memberId)
    .maybeSingle();
  if (!t) return null;

  let payment: TicketContext['payment'] = null;
  if (t.payment_ref && /^[0-9a-f-]{36}$/i.test(t.payment_ref)) {
    const { data: p } = await admin
      .from('payments')
      .select('id, amount, currency, provider, status')
      .eq('id', t.payment_ref)
      .maybeSingle();
    if (p) payment = { ...p, amount: Number(p.amount) } as TicketContext['payment'];
  }

  const ev = Array.isArray(t.events) ? t.events[0] : t.events;
  return {
    id: t.id, user_id: t.user_id, event_id: t.event_id, status: t.status, payment_ref: t.payment_ref,
    event: { ...ev, price_usd: Number(ev.price_usd), price_ngn: Number(ev.price_ngn) },
    payment,
  };
}

/** Upcoming events this ticket can move to: same price or cheaper, seats left, member has access. */
export async function eligibleMoveTargets(ticket: TicketContext, memberId: string) {
  const { data: events } = await createAdminClient()
    .from('events')
    .select('id, title, date, location, capacity, sold, min_tier, price_usd, price_ngn')
    .eq('is_active', true)
    .gt('date', new Date().toISOString())
    .neq('id', ticket.event_id)
    .order('date', { ascending: true })
    .limit(20);

  const paid = ticket.payment?.amount ?? 0;
  const currency = ticket.payment?.currency ?? 'USD';
  const out: { id: string; title: string; date: string; location: string }[] = [];

  for (const e of events ?? []) {
    if (e.sold >= e.capacity) continue;
    const price = Number(currency === 'NGN' ? e.price_ngn : e.price_usd);
    if (price > paid) continue;
    if (e.min_tier && !(await hasTierAccess(memberId, e.min_tier as MembershipTier))) continue;
    out.push({ id: e.id, title: e.title, date: e.date, location: e.location });
    if (out.length >= 5) break;
  }
  return out;
}

export async function moveTicket(ticket: TicketContext, newEventId: string, memberId: string): Promise<string> {
  const admin = createAdminClient();
  const targets = await eligibleMoveTargets(ticket, memberId);
  const target = targets.find(t => t.id === newEventId);
  if (!target) throw new Error('That event is no longer available for a move.');

  const { count } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', newEventId)
    .eq('user_id', memberId)
    .neq('status', 'cancelled');
  if ((count ?? 0) > 0) throw new Error('You already have a ticket for that event.');

  const { error: seatErr } = await admin.rpc('increment_event_sold', { event_id: newEventId, amount: 1 });
  if (seatErr) throw new Error('That event just sold out.');

  const token = generateTicketToken(ticket.id, newEventId, memberId);
  const { error } = await admin
    .from('tickets')
    .update({ event_id: newEventId, qr_token: token })
    .eq('id', ticket.id)
    .eq('status', 'valid');
  if (error) {
    await admin.rpc('increment_event_sold', { event_id: newEventId, amount: -1 });
    throw new Error('Could not move the ticket.');
  }
  await admin.rpc('increment_event_sold', { event_id: ticket.event_id, amount: -1 });
  return target.title;
}

export async function transferTicket(ticket: TicketContext, recipientEmail: string, memberId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from('members')
    .select('id, username')
    .eq('email', recipientEmail.trim().toLowerCase())
    .is('deleted_at', null)
    .maybeSingle();

  if (!recipient)               throw new Error("We couldn't find an Inner Circle account with that email. Ask them to sign up first, then try again.");
  if (recipient.id === memberId) throw new Error("That's your own email — send me your friend's instead.");

  const { count } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', ticket.event_id)
    .eq('user_id', recipient.id)
    .neq('status', 'cancelled');
  if ((count ?? 0) > 0) throw new Error('They already have a ticket for this event.');

  const { data: ev } = await admin.from('events').select('min_tier').eq('id', ticket.event_id).single();
  if (ev?.min_tier && !(await hasTierAccess(recipient.id, ev.min_tier as MembershipTier))) {
    throw new Error(`This event is for ${String(ev.min_tier).toUpperCase()}+ members, and they're not at that tier.`);
  }

  const token = generateTicketToken(ticket.id, ticket.event_id, recipient.id);
  const { error } = await admin
    .from('tickets')
    .update({ user_id: recipient.id, qr_token: token })
    .eq('id', ticket.id)
    .eq('user_id', memberId)
    .eq('status', 'valid');
  if (error) throw new Error('Could not transfer the ticket.');
  return recipient.username ?? 'your friend';
}

/** Free tickets: give the seat back. */
export async function releaseTicket(ticket: TicketContext) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('id', ticket.id)
    .eq('status', 'valid')
    .select('id');
  if (data?.length) await admin.rpc('increment_event_sold', { event_id: ticket.event_id, amount: -1 });
}
