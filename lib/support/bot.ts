/**
 * The concierge: first responder in every support conversation.
 *
 * Membership:  why are you leaving? → tailored offers (discount, same-price
 *              upgrade, pause) → talk to the team → or cancel (access runs to
 *              period end) → optional refund request (processed within 7 days).
 * Ticket:      can't make it? → move to another event (+20% off the next one),
 *              give it to a friend → talk to the team → or request a refund.
 * General:     straight to the team.
 *
 * "Talk to the team" and "cancel" are always on screen next to the offers.
 */
import { createAdminClient } from '@/lib/supabase';
import type { CurrentMember } from '@/lib/auth';
import { RETENTION, TEAM_REPLY_PROMISE } from '@/lib/support/config';
import { postMessage, updateThread, type ChatAction, type ThreadRow, type Topic } from '@/lib/support/threads';
import { notifyTeam } from '@/lib/support/notify';
import {
  availableMembershipOffers, grantEventDiscount, grantMembershipDiscount, grantTierUpgrade, pauseMembership, offeredRecently,
} from '@/lib/support/offers';
import { loadTicket, eligibleMoveTargets, moveTicket, transferTicket, releaseTicket } from '@/lib/support/tickets';
import {
  cancelMembershipAtPeriodEnd, resumeMembership, latestMembershipPayment, openRefundRequest, withdrawRefund,
} from '@/lib/support/refunds';

const TALK: ChatAction = { id: 'talk_team', label: 'Talk to the team', style: 'quiet' };
const pct = RETENTION.eventDiscountPercent;

// ─── Starting a conversation ────────────────────────────────────────────────────

export async function startThread(member: CurrentMember, topic: Topic, ticketId?: string | null): Promise<ThreadRow> {
  const admin = createAdminClient();

  // Reuse an open conversation about the same thing
  let q = admin.from('support_threads').select('*').eq('member_id', member.id).eq('topic', topic).neq('status', 'resolved');
  q = ticketId ? q.eq('ticket_id', ticketId) : q.is('ticket_id', null);
  const { data: existing } = await q.order('updated_at', { ascending: false }).limit(1);
  if (existing?.[0]) return existing[0] as ThreadRow;

  if (topic === 'ticket') {
    if (!ticketId) throw new Error('Choose a ticket');
    const ticket = await loadTicket(ticketId, member.id);
    if (!ticket || ticket.status !== 'valid') throw new Error('Ticket not found');
  }

  const { data: thread, error } = await admin
    .from('support_threads')
    .insert({ member_id: member.id, topic, ticket_id: ticketId ?? null })
    .select('*')
    .single();
  if (error || !thread) throw new Error('Could not open chat');

  await greet(thread as ThreadRow, member);
  return thread as ThreadRow;
}

async function greet(thread: ThreadRow, member: CurrentMember) {
  const name = member.username ? member.username.split('_')[0] : 'there';

  if (thread.topic === 'membership') {
    await postMessage(thread.id, 'bot',
      `Hey ${name}. Before anything changes, tell us what's going on. Most things, we can fix.`,
      { actions: [
        { id: 'reason:expensive', label: "It's too expensive right now" },
        { id: 'reason:not_using', label: "I'm not using it enough" },
        { id: 'reason:events',    label: "I can't make the events" },
        { id: 'reason:other',     label: 'Something else' },
        TALK,
      ] });
    return;
  }

  if (thread.topic === 'ticket') {
    const ticket = (await loadTicket(thread.ticket_id!, member.id))!;
    await postMessage(thread.id, 'bot',
      `Can't make ${ticket.event.title}? Don't lose your spot — here's what we can do.`,
      { actions: await ticketOptions(ticket) });
    return;
  }

  await postMessage(thread.id, 'bot', `Hey ${name}, you're talking to the Inner Circle team. What can we help with? ${TEAM_REPLY_PROMISE}`);
  await updateThread(thread.id, { status: 'waiting_team' });
}

async function ticketOptions(ticket: Awaited<ReturnType<typeof loadTicket>> & object): Promise<ChatAction[]> {
  const isFree = !ticket.payment || ticket.payment.amount === 0 || !ticket.payment.provider;
  return [
    { id: 'move',     label: `Move it to another event${isFree ? '' : ` (+${pct}% off your next)`}`, style: 'primary' },
    { id: 'transfer', label: 'Give it to a friend' },
    TALK,
    isFree
      ? { id: 'release',        label: 'Release my spot', style: 'danger' }
      : { id: 'request_refund', label: 'I still want a refund', style: 'danger' },
  ];
}

// ─── Button taps ────────────────────────────────────────────────────────────────

export async function handleAction(thread: ThreadRow, member: CurrentMember, actionId: string): Promise<void> {
  // Only accept buttons that were actually offered in the latest prompt
  const { data: last } = await createAdminClient()
    .from('support_messages')
    .select('actions')
    .eq('thread_id', thread.id)
    .not('actions', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
  const offered = (last?.[0]?.actions as ChatAction[] | undefined) ?? [];
  const chosen = offered.find(a => a.id === actionId);
  if (!chosen) throw new Error('That option has expired. Pick one of the latest options.');

  await postMessage(thread.id, 'member', chosen.label, { authorId: member.id });

  try {
    if (actionId === 'talk_team') return await handOff(thread, member, 'asked for the team');

    if (thread.topic === 'membership') return await membershipAction(thread, member, actionId);
    if (thread.topic === 'ticket')     return await ticketAction(thread, member, actionId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong.';
    await postMessage(thread.id, 'bot', `${msg} You can try another option or talk to the team.`, { actions: [TALK] });
  }
}

async function membershipAction(thread: ThreadRow, member: CurrentMember, id: string) {
  const ctx = { threadId: thread.id };

  if (id.startsWith('reason:')) {
    const reason = id.slice(7);
    await updateThread(thread.id, { reason, stage: 'offers' });
    return membershipOffers(thread, member, reason);
  }

  switch (id) {
    case 'offer:discount': return saved(thread, await grantMembershipDiscount(member.id, RETENTION.membershipDiscountPercent, ctx), member, 'took a membership discount');
    case 'offer:upgrade':  return saved(thread, await grantTierUpgrade(member.id, RETENTION.upgradeMonths, ctx), member, 'took a same-price upgrade');
    case 'offer:pause':    return saved(thread, await pauseMembership(member.id, RETENTION.pauseMonths, ctx), member, 'paused instead of cancelling');
    case 'offer:event_discount': return saved(thread, await grantEventDiscount(member.id, pct, ctx), member, `took ${pct}% off their next event`);

    case 'still_cancel': {
      const offers = await availableMembershipOffers(member.id);
      const end = offers.membership?.current_period_end ? new Date(offers.membership.current_period_end).toDateString() : 'the end of your period';
      await updateThread(thread.id, { stage: 'confirm_cancel' });
      return void await postMessage(thread.id, 'bot',
        `Understood. If you cancel, your membership won't renew and you keep everything until ${end}. Your seat goes back to the waitlist after that.`,
        { actions: [
          { id: 'keep', label: 'Never mind, keep my membership', style: 'primary' },
          TALK,
          { id: 'confirm_cancel', label: 'Yes, cancel my membership', style: 'danger' },
        ] });
    }

    case 'keep':
      await updateThread(thread.id, { status: 'resolved', outcome: 'saved', stage: 'done' });
      return void await postMessage(thread.id, 'bot', "Good call. You're still in the circle.");

    case 'confirm_cancel': {
      const msg = await cancelMembershipAtPeriodEnd(member.id);
      await updateThread(thread.id, { status: 'waiting_team', outcome: 'cancelled', stage: 'cancelled' });
      await notifyTeam(`${member.username ?? member.email} cancelled their membership`, [
        `Reason: ${thread.reason ?? 'not given'}`, 'Their access runs to the end of the period — a personal message may still win them back.',
      ], thread.id);
      return void await postMessage(thread.id, 'bot', `${msg} If you change your mind, tap below any time before then.`, {
        actions: [
          { id: 'resume', label: 'Changed my mind — keep it', style: 'primary' },
          { id: 'request_refund', label: 'Refund this period', style: 'danger' },
        ],
      });
    }

    case 'resume':
      await updateThread(thread.id, { status: 'resolved', outcome: 'saved', stage: 'done' });
      return void await postMessage(thread.id, 'bot', await resumeMembership(member.id));

    case 'request_refund': {
      const payment = await latestMembershipPayment(member.id);
      if (!payment) return handOff(thread, member, 'asked for a membership refund (no payment found)');
      return startRefund(thread, member, payment.id, payment.provider, 'membership', null);
    }

    case 'confirm_refund': return confirmRefund(thread, member);
  }
  throw new Error('Unknown option.');
}

async function membershipOffers(thread: ThreadRow, member: CurrentMember, reason: string) {
  const o = await availableMembershipOffers(member.id);
  if (!o.active) {
    await updateThread(thread.id, { status: 'waiting_team' });
    return void await postMessage(thread.id, 'bot',
      "I can't find an active membership on your account, so there's nothing to cancel. I've passed this to the team in case something's off.");
  }

  const upgrade  = o.upgrade  && { id: 'offer:upgrade',  label: `Upgrade to ${o.upgradeTo!.toUpperCase()} for ${RETENTION.upgradeMonths} months at your current price`, style: 'primary' as const };
  const discount = o.discount && { id: 'offer:discount', label: `Take ${RETENTION.membershipDiscountPercent}% off your next month`, style: 'primary' as const };
  const pause    = o.pause    && { id: 'offer:pause',    label: `Pause for ${RETENTION.pauseMonths} month — no charge, seat held` };
  const evDisc   = o.eventDiscount && { id: 'offer:event_discount', label: `${pct}% off your next event ticket`, style: 'primary' as const };

  const byReason: Record<string, (ChatAction | false | null)[]> = {
    expensive: [discount, pause, upgrade],
    not_using: [upgrade, pause, discount],
    events:    [evDisc, upgrade, pause],
    other:     [upgrade, discount, pause],
  };
  const intro: Record<string, string> = {
    expensive: "Totally fair. Let's make it lighter — on us:",
    not_using: "Then let's make it worth your while. Here's what we can do:",
    events:    "Dates don't always line up. Let's fix that:",
    other:     "Before you go, here's what we can offer:",
  };

  const offers = (byReason[reason] ?? byReason.other).filter(Boolean) as ChatAction[];
  await postMessage(thread.id, 'bot',
    offers.length ? intro[reason] ?? intro.other : "Let's get you to someone who can help properly.",
    { actions: [...offers, TALK, { id: 'still_cancel', label: 'I still want to cancel', style: 'danger' }] });
}

async function ticketAction(thread: ThreadRow, member: CurrentMember, id: string) {
  const ticket = await loadTicket(thread.ticket_id!, member.id);
  if (!ticket || ticket.status !== 'valid') {
    await updateThread(thread.id, { status: 'resolved', stage: 'done' });
    return void await postMessage(thread.id, 'bot', "This ticket isn't active any more, so there's nothing to change.");
  }

  if (id === 'move') {
    const targets = await eligibleMoveTargets(ticket, member.id);
    if (!targets.length) {
      return void await postMessage(thread.id, 'bot',
        "There's no other event on sale yet that we can move you to. The team can hold your spot for the next one — or you can still ask for a refund.",
        { actions: [TALK, { id: 'transfer', label: 'Give it to a friend instead' }, { id: 'request_refund', label: 'I still want a refund', style: 'danger' }] });
    }
    await updateThread(thread.id, { stage: 'choose_event' });
    return void await postMessage(thread.id, 'bot', 'Pick the event you want instead:', {
      actions: [
        ...targets.map(t => ({ id: `move_to:${t.id}`, label: `${t.title} — ${new Date(t.date).toDateString()}`, style: 'primary' as const })),
        { id: 'back', label: 'Back' },
      ],
    });
  }

  if (id.startsWith('move_to:')) {
    const title = await moveTicket(ticket, id.slice(8), member.id);
    let bonus = '';
    if (ticket.payment?.provider && !(await offeredRecently(member.id, 'event_discount'))) {
      await grantEventDiscount(member.id, pct, { threadId: thread.id });
      bonus = ` And as a thank-you, ${pct}% off your next event is saved to your account.`;
    }
    if (ticket.payment) await withdrawRefund(ticket.payment.id);
    return saved(thread, `Done — your ticket is now for ${title}. Your new QR code is in your account.${bonus}`, member, `moved their ticket to ${title}`);
  }

  if (id === 'back') {
    return void await postMessage(thread.id, 'bot', 'No problem. Here are your options:', { actions: await ticketOptions(ticket) });
  }

  if (id === 'transfer') {
    await updateThread(thread.id, { stage: 'await_transfer_email' });
    return void await postMessage(thread.id, 'bot',
      "Type your friend's email below. They need an Inner Circle account — the ticket moves to them instantly.",
      { actions: [{ id: 'back', label: 'Back' }] });
  }

  if (id === 'release') {
    await releaseTicket(ticket);
    await updateThread(thread.id, { status: 'resolved', outcome: 'cancelled', stage: 'done' });
    return void await postMessage(thread.id, 'bot', 'Your spot has been released for someone on the waitlist. See you at the next one.');
  }

  if (id === 'request_refund') {
    if (new Date(ticket.event.date) < new Date()) return handOff(thread, member, 'asked for a refund after the event');
    if (!ticket.payment) return handOff(thread, member, 'asked for a refund (no payment record)');
    return startRefund(thread, member, ticket.payment.id, ticket.payment.provider, 'ticket', ticket.id);
  }

  if (id === 'confirm_refund') return confirmRefund(thread, member);

  throw new Error('Unknown option.');
}

// ─── Refund steps ───────────────────────────────────────────────────────────────

async function startRefund(thread: ThreadRow, member: CurrentMember, paymentId: string, provider: string | null, kind: 'ticket' | 'membership', ticketId: string | null) {
  await updateThread(thread.id, { stage: provider === 'crypto' ? 'await_crypto_address' : 'confirm_refund' });
  await createAdminClient().from('support_threads').update({ reason: thread.reason ?? 'refund' }).eq('id', thread.id);
  // remember what we're refunding on the thread via a system note
  await postMessage(thread.id, 'system', `refund:${kind}:${paymentId}:${ticketId ?? ''}`);

  if (provider === 'crypto') {
    return void await postMessage(thread.id, 'bot',
      'Crypto refunds go back to a wallet you choose. Paste the wallet address and network below (e.g. "TRC20: T…").',
      { actions: [TALK] });
  }
  return void await postMessage(thread.id, 'bot',
    `Okay. Refund requests are reviewed by the team, and approved refunds are processed within ${RETENTION.refundDays} days to your original payment method. Someone may reach out first to see if we can make it right. Go ahead?`,
    { actions: [
      { id: 'confirm_refund', label: 'Yes, request my refund', style: 'danger' },
      TALK,
    ] });
}

async function confirmRefund(thread: ThreadRow, member: CurrentMember, cryptoAddress?: string) {
  const { data: notes } = await createAdminClient()
    .from('support_messages')
    .select('body')
    .eq('thread_id', thread.id)
    .eq('sender', 'system')
    .like('body', 'refund:%')
    .order('created_at', { ascending: false })
    .limit(1);
  const note = notes?.[0]?.body as string | undefined;
  if (!note) throw new Error('Start the refund again.');
  const [, kind, paymentId, ticketId] = note.split(':');

  const { dueAt, alreadyOpen } = await openRefundRequest({
    memberId: member.id, threadId: thread.id, paymentId, ticketId: ticketId || null,
    kind: kind as 'ticket' | 'membership', reason: thread.reason, cryptoAddress: cryptoAddress ?? null,
  });

  await updateThread(thread.id, { status: 'waiting_team', outcome: 'refund_requested', stage: 'refund_requested' });
  await notifyTeam(`Refund requested by ${member.username ?? member.email}`, [
    `Type: ${kind}`, `Process by: ${dueAt.toDateString()}`, 'Try a new date or a discount first — then refund if they still want it.',
  ], thread.id);

  await postMessage(thread.id, 'bot', alreadyOpen
    ? `You already have a refund request open — it will be processed by ${dueAt.toDateString()}.`
    : `Your refund request is in. It will be processed by ${dueAt.toDateString()}. The team may message you here first.`);
}

// ─── Free text ──────────────────────────────────────────────────────────────────

export async function handleMemberText(thread: ThreadRow, member: CurrentMember, text: string) {
  await postMessage(thread.id, 'member', text, { authorId: member.id });

  if (thread.stage === 'await_transfer_email') {
    const email = text.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return void await postMessage(thread.id, 'bot', "That doesn't look like an email address. Try again?", { actions: [{ id: 'back', label: 'Back' }] });
    }
    const ticket = await loadTicket(thread.ticket_id!, member.id);
    if (!ticket || ticket.status !== 'valid') return void await postMessage(thread.id, 'bot', "This ticket isn't active any more.");
    try {
      const to = await transferTicket(ticket, email, member.id);
      if (ticket.payment) await withdrawRefund(ticket.payment.id);
      return saved(thread, `Done — the ticket now belongs to ${to}. They'll see it in their account.`, member, `transferred their ticket to ${to}`);
    } catch (err) {
      return void await postMessage(thread.id, 'bot', err instanceof Error ? err.message : 'Could not transfer.', { actions: [{ id: 'back', label: 'Back' }, TALK] });
    }
  }

  if (thread.stage === 'await_crypto_address') {
    const addr = text.trim();
    if (addr.length < 20 || addr.length > 200) {
      return void await postMessage(thread.id, 'bot', 'Please paste the full wallet address, with the network (e.g. "TRC20: T…").', { actions: [TALK] });
    }
    return confirmRefund(thread, member, addr);
  }

  // Anything else goes to a human
  if (thread.status === 'bot' || thread.status === 'resolved') {
    await handOff(thread, member, 'sent a message');
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function handOff(thread: ThreadRow, member: CurrentMember, why: string, announce = true) {
  await updateThread(thread.id, { status: 'waiting_team' });
  await notifyTeam(`${member.username ?? member.email} ${why}`, [`Topic: ${thread.topic}`, `Reason: ${thread.reason ?? '—'}`], thread.id);
  if (announce || thread.status === 'resolved') {
    await postMessage(thread.id, 'bot', `You're through to the team — someone will reply right here. ${TEAM_REPLY_PROMISE}`);
  }
}

async function saved(thread: ThreadRow, message: string, member: CurrentMember, what: string) {
  await updateThread(thread.id, { status: 'resolved', outcome: 'saved', stage: 'done' });
  await postMessage(thread.id, 'bot', message);
  void member; void what; // kept for future analytics
}
