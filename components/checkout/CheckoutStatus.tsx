'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, AlertTriangle, X } from 'lucide-react';
import { track } from '@vercel/analytics';

interface PaymentStatus {
  status:   'pending' | 'processing' | 'fulfilled' | 'failed' | 'expired' | 'needs_attention';
  kind:     'membership' | 'ticket' | 'drop';
  tier:     string | null;
  provider: 'stripe' | 'paystack' | 'crypto' | null;
  event:    { id: string; title: string } | null;
  note:     string | null;
}

/** Polls the payment until it's confirmed, then shows what was bought. */
export function CheckoutStatus({ paymentId }: { paymentId: string }) {
  const [data,  setData]  = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);
  const tracked  = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const poll = async () => {
      attempts.current += 1;
      try {
        const res = await fetch(`/api/checkout/${paymentId}`, { cache: 'no-store' });
        if (res.status === 401) { setError('Sign in to see this payment.'); return; }
        if (!res.ok)            { setError('We could not find this payment.'); return; }
        const next: PaymentStatus = await res.json();
        if (stopped) return;
        setData(next);
        if (next.status === 'fulfilled' && !tracked.current) {
          tracked.current = true;
          track('purchase_completed', { kind: next.kind, provider: next.provider ?? 'free' });
        }
        if (next.status === 'pending' || next.status === 'processing') {
          // Cards confirm in seconds; crypto waits for blockchain confirmations.
          const delay = next.provider === 'crypto' ? 10_000 : attempts.current < 10 ? 2_000 : 5_000;
          timer = setTimeout(poll, delay);
        }
      } catch {
        if (!stopped) timer = setTimeout(poll, 5_000);
      }
    };

    poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [paymentId]);

  if (error) {
    return <Panel icon={<X size={28} />} tone="red" title="SOMETHING'S OFF" body={error} cta={{ href: '/', label: 'BACK HOME' }} />;
  }

  if (!data || data.status === 'pending' || data.status === 'processing') {
    const crypto = data?.provider === 'crypto';
    return (
      <Panel
        icon={<Loader2 size={28} className="animate-spin" />}
        tone="gold"
        title={crypto ? 'WAITING FOR THE BLOCKCHAIN' : 'CONFIRMING YOUR PAYMENT'}
        body={
          crypto
            ? 'Crypto payments confirm once the network does — usually a few minutes, longer for Bitcoin. You can close this page; your purchase completes automatically.'
            : 'Hold tight, this only takes a moment.'
        }
        note={data?.note ?? undefined}
      />
    );
  }

  if (data.status === 'fulfilled') {
    if (data.kind === 'drop') {
      return (
        <Panel icon={<Check size={28} />} tone="gold" title="SECURED"
          body="It's yours. We've emailed your confirmation, and the team will be in touch with delivery or access details."
          cta={{ href: '/drops', label: 'BACK TO DROPS' }} />
      );
    }
    return data.kind === 'ticket' ? (
      <Panel
        icon={<Check size={28} />}
        tone="gold"
        title="YOU'RE IN"
        body={`Your ticket for ${data.event?.title ?? 'the event'} is confirmed. We've emailed it to you with your QR code.`}
        cta={data.event ? { href: `/events/${data.event.id}`, label: 'VIEW EVENT' } : { href: '/events', label: 'ALL EVENTS' }}
      />
    ) : (
      <Panel
        icon={<Check size={28} />}
        tone="gold"
        title={`WELCOME TO ${(data.tier ?? '').toUpperCase()}`}
        body="Your membership is active. Welcome to the circle."
        cta={{ href: '/events', label: 'SEE MEMBER EVENTS' }}
      />
    );
  }

  if (data.status === 'needs_attention') {
    return (
      <Panel
        icon={<AlertTriangle size={28} />}
        tone="red"
        title="PAYMENT RECEIVED — WE'RE ON IT"
        body="Your payment went through but we couldn't finish setting things up automatically (for example, the last ticket sold at the same moment). Our team has been flagged and will sort it out or refund you."
        cta={{ href: '/', label: 'BACK HOME' }}
      />
    );
  }

  return (
    <Panel
      icon={<X size={28} />}
      tone="red"
      title={data.status === 'expired' ? 'CHECKOUT EXPIRED' : 'PAYMENT DIDN\'T GO THROUGH'}
      body="No charge was completed. You can try again whenever you're ready."
      note={data.note ?? undefined}
      cta={data.kind === 'ticket' && data.event
        ? { href: `/events/${data.event.id}`, label: 'TRY AGAIN' }
        : { href: '/membership', label: 'TRY AGAIN' }}
    />
  );
}

function Panel(props: {
  icon: React.ReactNode; tone: 'gold' | 'red'; title: string; body: string;
  note?: string; cta?: { href: string; label: string };
}) {
  const color = props.tone === 'gold' ? 'text-ic-gold border-ic-gold/40' : 'text-ic-red border-ic-red/40';
  return (
    <div className="border border-ic-border bg-ic-dark p-8 md:p-12 text-center max-w-lg w-full">
      <div className={`w-16 h-16 mx-auto mb-6 border flex items-center justify-center ${color}`}>{props.icon}</div>
      <h1 className="font-bebas text-4xl md:text-5xl text-white mb-4 leading-none">{props.title}</h1>
      <p className="text-ic-silver text-sm leading-relaxed">{props.body}</p>
      {props.note && <p className="font-mono text-[11px] tracking-widest text-ic-muted mt-4">{props.note}</p>}
      {props.cta && (
        <Link href={props.cta.href} className="btn-primary mt-8 px-10 py-3 text-sm">{props.cta.label}</Link>
      )}
    </div>
  );
}
