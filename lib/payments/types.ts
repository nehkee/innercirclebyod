import type { MembershipTier } from '@/types';

export type PaymentProvider = 'stripe' | 'paystack' | 'crypto';

export interface PaymentRow {
  id:                  string;
  member_id:           string;
  kind:                'membership' | 'ticket' | 'drop';
  tier:                MembershipTier | null;
  event_id:            string | null;
  drop_id?:            string | null;
  provider:            PaymentProvider | null;
  currency:            'USD' | 'NGN';
  amount:              number | string;
  status:              'pending' | 'processing' | 'fulfilled' | 'failed' | 'expired' | 'needs_attention';
  provider_ref:        string | null;
  provider_payment_id: string | null;
  failure_reason:      string | null;
  created_at:          string;
}

export type Verified =
  | { ok: true; providerPaymentId?: string; stripeCustomerId?: string; stripeSubscriptionId?: string }
  | { ok: false; reason: string; final?: 'failed' | 'expired' };

/** Amount in the smallest currency unit (cents / kobo). */
export const minorUnits = (amount: number | string) => Math.round(Number(amount) * 100);
