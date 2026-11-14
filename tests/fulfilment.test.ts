/** Payments turn into tickets and drops exactly once, and never oversell. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';

vi.mock('@/lib/supabase', async () => await import('./helpers/fake-supabase.js'));

import { db, reset } from './helpers/fake-supabase.js';
import { completePayment } from '@/lib/payments/fulfill';

/* eslint-disable @typescript-eslint/no-explicit-any */
const member = { id: 'm1', email: 'm1@x.com', username: 'M1', tier: 'insider', points: 0 };

function payment(over: Record<string, unknown>) {
  const row = { id: randomUUID(), member_id: member.id, provider: 'paystack', currency: 'NGN', amount: 1000, status: 'pending', offer_id: null, created_at: new Date().toISOString(), ...over };
  db.payments.push(row);
  return row;
}

beforeEach(() => {
  reset();
  db.members.push({ ...member });
  db.events.push({ id: 'ev', title: 'SHOW', date: new Date(Date.now() + 864e5).toISOString(), venue: null, capacity: 1, sold: 0 });
  db.drops.push({ id: 'dr', name: 'TEE', type: 'merch', quantity: 1, sold: 0 });
});

describe('tickets', () => {
  it('issues one ticket with a QR code and counts the seat', async () => {
    const p = payment({ kind: 'ticket', event_id: 'ev' });
    expect(await completePayment(p.id)).toBe('fulfilled');
    expect(db.tickets).toHaveLength(1);
    expect(db.tickets[0].qr_token).toBeTruthy();
    expect(db.events[0].sold).toBe(1);
  });
  it('a duplicate webhook does nothing the second time', async () => {
    const p = payment({ kind: 'ticket', event_id: 'ev' });
    await completePayment(p.id);
    expect(await completePayment(p.id)).toBe('already_handled');
    expect(db.tickets).toHaveLength(1);
  });
  it('flags (not loses) a payment when the last seat has gone', async () => {
    db.events[0].sold = 1;
    const p = payment({ kind: 'ticket', event_id: 'ev' });
    expect(await completePayment(p.id)).toBe('needs_attention');
    expect(db.payments.find((x: any) => x.id === p.id).status).toBe('needs_attention');
  });
});

describe('drops', () => {
  it('records the order and decrements stock', async () => {
    const p = payment({ kind: 'drop', drop_id: 'dr' });
    expect(await completePayment(p.id)).toBe('fulfilled');
    expect(db.drop_orders).toHaveLength(1);
    expect(db.drops[0].sold).toBe(1);
  });
  it('never oversells a limited run', async () => {
    await completePayment(payment({ kind: 'drop', drop_id: 'dr' }).id);
    db.members.push({ id: 'm2', email: 'm2@x.com', username: 'M2', points: 0 });
    const second = payment({ kind: 'drop', drop_id: 'dr', member_id: 'm2' });
    expect(await completePayment(second.id)).toBe('needs_attention');
    expect(db.drops[0].sold).toBe(1);
  });
});
