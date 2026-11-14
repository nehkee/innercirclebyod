'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CreditCard, Landmark, Bitcoin, Loader2, Ticket } from 'lucide-react';
import type { PaymentMethods } from '@/lib/payments/config';
import type { MembershipTier } from '@/types';

export type CheckoutProduct =
  | { kind: 'membership'; tier: MembershipTier }
  | { kind: 'ticket'; eventId: string };

type Method = 'card' | 'paystack' | 'crypto' | 'free';

interface CheckoutOptionsProps {
  product:  CheckoutProduct;
  methods:  PaymentMethods;
  priceUSD: number;
  priceNGN: number;
}

const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const ngn = (n: number) => `₦${n.toLocaleString('en-NG')}`;

/** Payment method buttons. Each one starts a checkout and sends the buyer to the provider. */
export function CheckoutOptions({ product, methods, priceUSD, priceNGN }: CheckoutOptionsProps) {
  const pathname = usePathname();
  const [busy, setBusy] = useState<Method | null>(null);

  const isMembership = product.kind === 'membership';
  const isFree = !isMembership && priceUSD === 0 && priceNGN === 0;

  async function start(method: Method) {
    setBusy(method);
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...product, method }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(pathname)}`;
        return;
      }
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Could not start checkout. Please try again.');
        setBusy(null);
        return;
      }
      window.location.href = data.url; // provider's hosted checkout (or success page)
    } catch {
      toast.error('Network error. Please try again.');
      setBusy(null);
    }
  }

  if (isFree) {
    return (
      <MethodButton
        onClick={() => start('free')}
        busy={busy === 'free'}
        disabled={busy !== null}
        icon={<Ticket size={16} />}
        title="CLAIM FREE TICKET"
        price="FREE"
        note="Members only · one per member"
        primary
      />
    );
  }

  const options = [
    methods.card && priceUSD > 0 && {
      method: 'card' as const,
      icon:   <CreditCard size={16} />,
      title:  'PAY WITH CARD',
      price:  usd(priceUSD) + (isMembership ? '/mo' : ''),
      note:   isMembership ? 'Visa · Mastercard · Amex — renews monthly, cancel anytime' : 'Visa · Mastercard · Amex · Apple Pay',
    },
    methods.paystack && priceNGN > 0 && {
      method: 'paystack' as const,
      icon:   <Landmark size={16} />,
      title:  'PAYSTACK (NAIRA)',
      price:  ngn(priceNGN),
      note:   isMembership ? 'Card · bank transfer · USSD — 30 days access' : 'Card · bank transfer · USSD',
    },
    methods.crypto && priceUSD > 0 && {
      method: 'crypto' as const,
      icon:   <Bitcoin size={16} />,
      title:  'PAY WITH CRYPTO',
      price:  usd(priceUSD),
      note:   `USDT · USDC · BTC — Tron, Ethereum, Solana & more${isMembership ? ' — 30 days access' : ''}`,
    },
  ].filter(Boolean) as { method: Method; icon: React.ReactNode; title: string; price: string; note: string }[];

  if (options.length === 0) {
    return (
      <div className="border border-ic-border p-5 text-center">
        <p className="font-bebas tracking-widest text-ic-muted text-lg mb-1">PAYMENTS OPEN SOON</p>
        <p className="font-mono text-[10px] tracking-widest text-ic-muted mb-4">GET NOTIFIED WHEN CHECKOUT GOES LIVE</p>
        <Link href="/join" className="btn-primary py-2 px-6 text-xs">JOIN THE WAITLIST</Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {options.map((o, i) => (
        <MethodButton
          key={o.method}
          onClick={() => start(o.method)}
          busy={busy === o.method}
          disabled={busy !== null}
          icon={o.icon}
          title={o.title}
          price={o.price}
          note={o.note}
          primary={i === 0}
        />
      ))}
      <p className="font-mono text-[9px] tracking-widest text-ic-muted text-center pt-1">
        SECURE CHECKOUT · WE NEVER SEE YOUR CARD OR WALLET KEYS
      </p>
      <p className="font-mono text-[9px] tracking-widest text-ic-muted text-center">
        CAN&apos;T MAKE IT? WE&apos;LL MOVE YOUR DATE OR <Link href="/refunds" className="underline hover:text-ic-gold">REFUND YOU</Link>
      </p>
    </div>
  );
}

function MethodButton(props: {
  onClick: () => void; busy: boolean; disabled: boolean;
  icon: React.ReactNode; title: string; price: string; note: string; primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`group w-full text-left border p-4 transition-all duration-200 disabled:opacity-60 ${
        props.primary
          ? 'border-ic-gold bg-ic-gold/10 hover:bg-ic-gold/20'
          : 'border-ic-border hover:border-ic-gold/60 bg-ic-gray/20'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-ic-gold">
          {props.busy ? <Loader2 size={16} className="animate-spin" /> : props.icon}
          <span className="font-bebas tracking-widest text-lg text-white group-hover:text-ic-gold transition-colors">
            {props.title}
          </span>
        </span>
        <span className="font-bebas text-xl text-ic-gold whitespace-nowrap">{props.price}</span>
      </div>
      <p className="font-mono text-[9px] tracking-widest text-ic-muted mt-1">{props.note}</p>
    </button>
  );
}
