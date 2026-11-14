import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyIpnSignature } from '@/lib/payments/nowpayments';
import { generateTicketToken, verifyTicketToken, tokenFromScan, ticketQrPayload } from '@/lib/qr';
import { memberCardToken, verifyMemberCardToken } from '@/lib/member-card';
import { hashDropPassword, checkDropPassword } from '@/lib/drops';

// NOWPayments' documented signing algorithm, verbatim
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj).sort().reduce((r, k) => {
    const v = obj[k];
    r[k] = v && typeof v === 'object' ? sortObject(v as Record<string, unknown>) : v;
    return r;
  }, {} as Record<string, unknown>);
}
const sign = (body: Record<string, unknown>, key = 'test-ipn-secret') =>
  crypto.createHmac('sha512', key).update(JSON.stringify(sortObject(body))).digest('hex');

const ipn = {
  payment_status: 'finished', payment_id: 5077125051, order_id: '9a1c2b3d-0000-4000-8000-000000000001',
  price_amount: 25, price_currency: 'usd', pay_currency: 'usdttrc20', actually_paid: 25.1,
  fee: { currency: 'usdttrc20', depositFee: 0, withdrawalFee: 0, serviceFee: 0 }, invoice_id: 123,
};

describe('NOWPayments IPN signature', () => {
  it('accepts a genuine notification, whatever the key order', () => {
    const sig = sign(ipn);
    expect(verifyIpnSignature(ipn, sig)).toBe(true);
    expect(verifyIpnSignature(Object.fromEntries(Object.entries(ipn).reverse()), sig)).toBe(true);
  });
  it('rejects tampering, wrong secrets and missing headers', () => {
    const sig = sign(ipn);
    expect(verifyIpnSignature({ ...ipn, price_amount: 2500 }, sig)).toBe(false);
    expect(verifyIpnSignature({ ...ipn, payment_status: 'waiting' }, sig)).toBe(false);
    expect(verifyIpnSignature(ipn, sign(ipn, 'other'))).toBe(false);
    expect(verifyIpnSignature(ipn, null)).toBe(false);
    expect(verifyIpnSignature(ipn, 'abc')).toBe(false);
  });
});

describe('ticket QR tokens', () => {
  it('round-trips and survives the scan URL', () => {
    const token = generateTicketToken('t1', 'e1', 'm1');
    expect(verifyTicketToken(token)).toMatchObject({ ticketId: 't1', eventId: 'e1', userId: 'm1' });
    expect(tokenFromScan(ticketQrPayload(token))).toBe(token);
    expect(tokenFromScan(`  ${token} `)).toBe(token);
  });
  it('rejects forged or altered tokens', () => {
    const token = generateTicketToken('t1', 'e1', 'm1');
    const [payload, sig] = token.split('.');
    const forged = Buffer.from('t1:e2:m1:1').toString('base64url');
    expect(verifyTicketToken(`${forged}.${sig}`)).toBeNull();
    expect(verifyTicketToken(`${payload}.x${sig.slice(1)}`)).toBeNull();
    expect(verifyTicketToken('garbage')).toBeNull();
  });
});

describe('membership card tokens', () => {
  it('verifies genuine cards only', () => {
    const t = memberCardToken('7f1c-member');
    expect(verifyMemberCardToken(t)).toBe('7f1c-member');
    expect(verifyMemberCardToken(t.replace(/.$/, c => (c === 'A' ? 'B' : 'A')))).toBeNull();
    expect(verifyMemberCardToken('m.abc')).toBeNull();
  });
});

describe('drop passwords', () => {
  it('is case-insensitive, salted per drop, and rejects wrong passwords', () => {
    const hash = hashDropPassword('drop-1', 'Vault');
    expect(checkDropPassword('drop-1', 'VAULT', hash)).toBe(true);
    expect(checkDropPassword('drop-1', ' vault ', hash)).toBe(true);
    expect(checkDropPassword('drop-2', 'VAULT', hash)).toBe(false);
    expect(checkDropPassword('drop-1', 'nope', hash)).toBe(false);
    expect(checkDropPassword('drop-1', 'VAULT', null)).toBe(false);
  });
});
