/**
 * NOWPayments client (crypto checkout).
 * API reference: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 *
 * The customer picks the coin on NOWPayments' hosted invoice page. Which
 * coins are offered is set in the NOWPayments dashboard → "Coins settings"
 * (e.g. USDT-TRC20, USDT-ERC20, USDC, USDT-SOL, USDC-SOL, BTC).
 */
import { createHmac, timingSafeEqual } from 'crypto';

const API = 'https://api.nowpayments.io/v1';

export type NowPaymentStatus =
  | 'waiting' | 'confirming' | 'confirmed' | 'sending'
  | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';

export interface NowPayment {
  payment_id:      number | string;
  invoice_id:      number | string | null;
  payment_status:  NowPaymentStatus;
  order_id:        string | null;
  price_amount:    number;
  price_currency:  string;
  pay_amount:      number;
  actually_paid:   number;
  pay_currency:    string;
  outcome_amount?: number;
  outcome_currency?: string;
}

function apiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new Error('NOWPAYMENTS_API_KEY is not set');
  return key;
}

export async function createInvoice(params: {
  priceUSD:     number;
  orderId:      string;
  description:  string;
  ipnUrl:       string;
  successUrl:   string;
  cancelUrl:    string;
}): Promise<{ id: string; invoice_url: string }> {
  const res = await fetch(`${API}/invoice`, {
    method:  'POST',
    headers: { 'x-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price_amount:       params.priceUSD,
      price_currency:     'usd',
      order_id:           params.orderId,
      order_description:  params.description,
      ipn_callback_url:   params.ipnUrl,
      success_url:        params.successUrl,
      cancel_url:         params.cancelUrl,
      partially_paid_url: params.successUrl,
      is_fixed_rate:      true,   // rate frozen while the customer pays
      is_fee_paid_by_user: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`NOWPayments invoice failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return { id: String(data.id), invoice_url: data.invoice_url };
}

/** Fetch the authoritative payment state (never trust the webhook body alone). */
export async function getPayment(paymentId: string | number): Promise<NowPayment> {
  const res = await fetch(`${API}/payment/${encodeURIComponent(String(paymentId))}`, {
    headers: { 'x-api-key': apiKey() },
    cache:   'no-store',
  });
  if (!res.ok) throw new Error(`NOWPayments payment lookup failed (${res.status})`);
  return res.json();
}

/** Keys sorted recursively, as NOWPayments does before signing. */
function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObject((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
  return value;
}

/** Verify the x-nowpayments-sig header: HMAC-SHA512 of the key-sorted JSON body with the IPN secret. */
export function verifyIpnSignature(body: unknown, signature: string | null): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha512', secret.trim()).update(JSON.stringify(sortObject(body))).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
