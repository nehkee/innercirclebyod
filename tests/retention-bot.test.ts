/**
 * The concierge bot end to end against an in-memory database:
 * offers, cooldowns, cancel path, ticket moves/transfers, refunds.
 * Tests in this file share state and run in order.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { randomUUID } from 'crypto';

vi.mock('@/lib/supabase', async () => await import('./helpers/fake-supabase.js'));

const fetchCalls: { url: string; body?: string }[] = [];
vi.stubGlobal('fetch', async (url: string, init?: { body?: string }) => {
  fetchCalls.push({ url, body: init?.body });
  return { ok: true, json: async () => ({ status: true, message: 'Refund queued' }) };
});

import { db, reset } from './helpers/fake-supabase.js';
import * as bot from '@/lib/support/bot';
import * as refunds from '@/lib/support/refunds';
import * as offers from '@/lib/support/offers';
import { getActiveTier } from '@/lib/membership';
import type { CurrentMember } from '@/lib/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */
const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const msgs = (tid: string) => db.support_messages.filter((m: any) => m.thread_id === tid);
const lastBot = (tid: string) => [...msgs(tid)].reverse().find((m: any) => m.sender === 'bot');
const ids = (m: any): string[] => (m?.actions ?? []).map((a: any) => a.id);
const thread = (tid: string) => db.support_threads.find((t: any) => t.id === tid);

const P = { adaMem: randomUUID(), adaTix: randomUUID(), adaTix2: randomUUID(), bayoTix: randomUUID() };
const ada  = { id: 'm-ada',  clerk_id: 'c1', email: 'ada@x.com',  username: 'ADA_LAGOS', tier: 'insider', is_admin: false, access_granted: true, points: 0 } as CurrentMember & { points: number };
const bayo = { id: 'm-bayo', clerk_id: 'c2', email: 'bayo@x.com', username: 'BAYO',      tier: 'insider', is_admin: false, access_granted: true, points: 0 } as CurrentMember & { points: number };
const boss = { id: 'm-boss', clerk_id: 'c3', email: 'boss@x.com', username: 'TEAM',      tier: 'sovereign', is_admin: true, access_granted: true, points: 0 };

beforeAll(() => {
  reset();
  db.members.push(ada, bayo, boss);
  const ms = (user_id: string, provider: string, end: number) => ({
    user_id, tier: 'insider', status: 'active', payment_provider: provider, stripe_sub_id: null,
    current_period_end: days(end), cancel_at_period_end: false, paused_until: null, bonus_tier: null, bonus_until: null,
  });
  db.memberships.push(ms(ada.id, 'crypto', 20), ms(bayo.id, 'paystack', 25));
  db.events.push(
    { id: 'e-A', title: 'THE LISTENING ROOM', date: days(10), location: 'Lagos, Nigeria', capacity: 100, sold: 10, min_tier: null, price_usd: 75,  price_ngn: 115000, is_active: true },
    { id: 'e-B', title: 'CLOSED DOOR ABUJA',  date: days(40), location: 'Abuja, Nigeria', capacity: 50,  sold: 5,  min_tier: null, price_usd: 50,  price_ngn: 80000,  is_active: true },
    { id: 'e-C', title: 'LONDON SHOW',        date: days(50), location: 'London, UK',     capacity: 50,  sold: 5,  min_tier: null, price_usd: 120, price_ngn: 180000, is_active: true },
  );
  db.payments.push(
    { id: P.adaMem,  member_id: ada.id,  kind: 'membership', tier: 'insider', provider: 'crypto',   currency: 'USD', amount: 25,     status: 'fulfilled', provider_payment_id: 'np-1',   created_at: days(-10) },
    { id: P.adaTix,  member_id: ada.id,  kind: 'ticket', event_id: 'e-A',     provider: 'paystack', currency: 'NGN', amount: 115000, status: 'fulfilled', provider_payment_id: '987654', created_at: days(-5) },
    { id: P.adaTix2, member_id: ada.id,  kind: 'ticket', event_id: 'e-A',     provider: 'paystack', currency: 'NGN', amount: 115000, status: 'fulfilled', provider_payment_id: '987655', created_at: days(-4) },
    { id: P.bayoTix, member_id: bayo.id, kind: 'ticket', event_id: 'e-B',     provider: 'paystack', currency: 'NGN', amount: 80000,  status: 'fulfilled', provider_payment_id: '111222', created_at: days(-1) },
  );
  db.tickets.push(
    { id: 't-1', user_id: ada.id,  event_id: 'e-A', status: 'valid', payment_status: 'paid', payment_ref: P.adaTix },
    { id: 't-2', user_id: ada.id,  event_id: 'e-A', status: 'valid', payment_status: 'paid', payment_ref: P.adaTix2 },
    { id: 't-3', user_id: bayo.id, event_id: 'e-B', status: 'valid', payment_status: 'paid', payment_ref: P.bayoTix },
  );
});

describe('membership: "can\'t make events" → same-price upgrade', () => {
  let tid = '';
  it('greets with reasons and a route to the team', async () => {
    tid = (await bot.startThread(ada, 'membership')).id;
    expect(ids(lastBot(tid))).toEqual(expect.arrayContaining(['reason:events', 'talk_team']));
  });
  it('offers tailored perks with cancel and team always visible', async () => {
    await bot.handleAction(thread(tid), ada, 'reason:events');
    const o = ids(lastBot(tid));
    expect(o).toEqual(expect.arrayContaining(['offer:event_discount', 'offer:upgrade', 'talk_team', 'still_cancel']));
    expect(o).not.toContain('offer:pause'); // crypto pass, not a card subscription
  });
  it('applies the upgrade at the same price', async () => {
    await bot.handleAction(thread(tid), ada, 'offer:upgrade');
    expect(await getActiveTier(ada.id)).toBe('vanguard');
    expect(thread(tid)).toMatchObject({ status: 'resolved', outcome: 'saved' });
  });
  it('refuses perks that were never offered', async () => {
    await expect(bot.handleAction(thread(tid), ada, 'offer:discount')).rejects.toThrow();
  });
});

describe('membership: insists on cancelling → crypto refund', () => {
  let tid = '';
  it('respects the cooldown and confirms before cancelling', async () => {
    tid = (await bot.startThread(ada, 'membership')).id;
    await bot.handleAction(thread(tid), ada, 'reason:expensive');
    expect(ids(lastBot(tid))).toContain('offer:discount');
    expect(ids(lastBot(tid))).not.toContain('offer:upgrade');
    await bot.handleAction(thread(tid), ada, 'still_cancel');
    expect(ids(lastBot(tid))).toEqual(expect.arrayContaining(['keep', 'talk_team', 'confirm_cancel']));
  });
  it('cancels at period end and alerts the team', async () => {
    await bot.handleAction(thread(tid), ada, 'confirm_cancel');
    expect(db.memberships.find((m: any) => m.user_id === ada.id).cancel_at_period_end).toBe(true);
    expect(thread(tid)).toMatchObject({ status: 'waiting_team', outcome: 'cancelled' });
  });
  it('opens a 7-day refund request with the wallet address', async () => {
    await bot.handleAction(thread(tid), ada, 'request_refund');
    expect(thread(tid).stage).toBe('await_crypto_address');
    await bot.handleMemberText(thread(tid), ada, 'short');
    expect(db.refund_requests).toHaveLength(0);
    await bot.handleMemberText(thread(tid), ada, 'TRC20: TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
    const rr = db.refund_requests[0];
    expect(rr.kind).toBe('membership');
    expect(rr.crypto_address).toMatch(/^TRC20/);
    expect(Math.round((Date.parse(rr.due_at) - Date.now()) / 86_400_000)).toBe(7);
  });
});

describe('tickets: move, transfer, refund', () => {
  it('moves to a same-or-cheaper event and saves a 20% thank-you', async () => {
    const tid = (await bot.startThread(ada, 'ticket', 't-1')).id;
    expect(ids(lastBot(tid))).toEqual(expect.arrayContaining(['move', 'transfer', 'talk_team', 'request_refund']));
    await bot.handleAction(thread(tid), ada, 'move');
    expect(ids(lastBot(tid))).toContain('move_to:e-B');
    expect(ids(lastBot(tid))).not.toContain('move_to:e-C');
    await bot.handleAction(thread(tid), ada, 'move_to:e-B');
    expect(db.tickets.find((t: any) => t.id === 't-1').event_id).toBe('e-B');
    expect(db.events.find((e: any) => e.id === 'e-A').sold).toBe(9);
    expect(db.events.find((e: any) => e.id === 'e-B').sold).toBe(6);
    const disc = await offers.findUsableDiscount(ada.id, 'event_discount');
    expect(disc?.percent).toBe(20);
    await offers.consumeOffer(disc!.id, randomUUID());
    expect(await offers.findUsableDiscount(ada.id, 'event_discount')).toBeNull();
  });
  it('gives a ticket to a friend who has an account', async () => {
    const tid = (await bot.startThread(ada, 'ticket', 't-2')).id;
    await bot.handleAction(thread(tid), ada, 'transfer');
    await bot.handleMemberText(thread(tid), ada, 'not-an-email');
    await bot.handleMemberText(thread(tid), ada, 'nobody@x.com');
    expect(lastBot(tid).body).toMatch(/couldn't find/);
    await bot.handleMemberText(thread(tid), ada, 'BAYO@x.com');
    expect(db.tickets.find((t: any) => t.id === 't-2').user_id).toBe(bayo.id);
  });
  it('refunds through Paystack once, releasing the seat', async () => {
    const tid = (await bot.startThread(bayo, 'ticket', 't-3')).id;
    await bot.handleAction(thread(tid), bayo, 'move'); // nothing cheaper → team / transfer / refund
    expect(ids(lastBot(tid))).toEqual(expect.arrayContaining(['talk_team', 'transfer', 'request_refund']));
    await bot.handleAction(thread(tid), bayo, 'request_refund');
    await bot.handleAction(thread(tid), bayo, 'confirm_refund');
    const req = db.refund_requests.find((r: any) => r.payment_id === P.bayoTix);
    const before = db.events.find((e: any) => e.id === 'e-B').sold;
    await refunds.executeRefund(req.id, boss.id);
    expect(fetchCalls.some(c => c.url.includes('api.paystack.co/refund') && c.body?.includes('111222'))).toBe(true);
    expect(db.tickets.find((t: any) => t.id === 't-3').status).toBe('refunded');
    expect(db.events.find((e: any) => e.id === 'e-B').sold).toBe(before - 1);
    await expect(refunds.executeRefund(req.id, boss.id)).rejects.toThrow();
  });
  it('crypto refunds need a manual "mark as refunded"', async () => {
    const rr = db.refund_requests.find((r: any) => r.kind === 'membership');
    await expect(refunds.executeRefund(rr.id, boss.id)).rejects.toThrow(/manually/);
    await refunds.executeRefund(rr.id, boss.id, { manualConfirm: true });
    expect(rr.status).toBe('refunded');
    expect(db.memberships.find((m: any) => m.user_id === ada.id).status).toBe('cancelled');
  });
});

describe('general', () => {
  it('a general chat goes straight to the team', async () => {
    const tid = (await bot.startThread(bayo, 'general')).id;
    expect(thread(tid).status).toBe('waiting_team');
  });
});
