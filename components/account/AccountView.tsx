'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Crown, Ticket, Gift, MessageCircle, Loader2, Pause, ArrowUpRight } from 'lucide-react';
import { openChat } from '@/components/support/openChat';
import { TIERS } from '@/lib/constants';

interface AccountData {
  member: { username: string | null; email: string };
  membership: null | {
    tier: string; effectiveTier: string | null; status: string; provider: string | null;
    autoRenews: boolean; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean;
    pausedUntil: string | null; bonusTier: string | null; bonusUntil: string | null;
  };
  tickets: { id: string; status: string; event: { id: string; title: string; date: string; location: string } | null }[];
  offers:  { id: string; kind: string; percent: number; expires_at: string | null }[];
  refunds: { id: string; kind: string; status: string; due_at: string; amount: number; currency: string }[];
}

const tierColor = (id?: string | null) => TIERS.find(t => t.id === id)?.color ?? '#C9A84C';
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export function AccountView({ authEnabled }: { authEnabled: boolean }) {
  const [data, setData]     = useState<AccountData | null>(null);
  const [state, setState]   = useState<'loading' | 'ready' | 'signed_out' | 'error'>('loading');

  const load = useCallback(async () => {
    if (!authEnabled) { setState('signed_out'); return; }
    const res = await fetch('/api/account', { cache: 'no-store' });
    if (res.status === 401) { setState('signed_out'); return; }
    if (!res.ok) { setState('error'); return; }
    setData(await res.json());
    setState('ready');
  }, [authEnabled]);

  useEffect(() => { load(); }, [load]);

  async function resume() {
    const res = await fetch('/api/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) { toast.success(body.message); load(); } else toast.error(body.error ?? 'Could not resume');
  }

  if (state === 'loading') {
    return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-ic-gold" /></div>;
  }

  if (state === 'signed_out') {
    return (
      <div className="border border-ic-border p-10 text-center max-w-lg mx-auto">
        <p className="font-bebas text-4xl text-white mb-3">SIGN IN TO SEE YOUR MEMBERSHIP</p>
        <p className="text-ic-muted text-sm mb-8">Your tier, tickets and perks live here.</p>
        <Link href="/sign-in?redirect_url=/account" className="btn-primary px-10 py-3 text-sm">SIGN IN</Link>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return <p className="text-center font-mono text-xs tracking-widest text-ic-muted py-24">COULD NOT LOAD YOUR ACCOUNT. TRY AGAIN SHORTLY.</p>;
  }

  const m = data.membership;
  const active = Boolean(m?.effectiveTier) || Boolean(m?.pausedUntil && new Date(m.pausedUntil) > new Date());
  const upcoming = data.tickets.filter(t => t.status === 'valid' && t.event && new Date(t.event.date) > new Date());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Membership */}
      <section className="lg:col-span-2 border border-ic-border p-6 md:p-8" style={{ borderColor: active ? `${tierColor(m?.effectiveTier ?? m?.tier)}55` : undefined }}>
        <p className="section-label mb-4 flex items-center gap-2"><Crown size={12} /> MEMBERSHIP</p>
        {!m || !active ? (
          <>
            <p className="font-bebas text-5xl text-white leading-none mb-3">NOT A MEMBER YET</p>
            <p className="text-ic-muted text-sm mb-6">Choose a tier to unlock events, drops and the circle.</p>
            <Link href="/membership" className="btn-primary px-8 py-3 text-sm">VIEW TIERS</Link>
          </>
        ) : (
          <>
            <p className="font-bebas leading-none mb-2" style={{ fontSize: 'clamp(48px, 8vw, 80px)', color: tierColor(m.effectiveTier ?? m.tier) }}>
              {(m.effectiveTier ?? m.tier).toUpperCase()}
            </p>
            <div className="space-y-1 font-mono text-[11px] tracking-widest text-ic-muted mb-6">
              {m.pausedUntil && new Date(m.pausedUntil) > new Date() ? (
                <p className="flex items-center gap-2 text-ic-gold"><Pause size={12} /> PAUSED UNTIL {fmtDate(m.pausedUntil).toUpperCase()} · NO CHARGES</p>
              ) : m.cancelAtPeriodEnd ? (
                <p className="text-ic-red">ENDS {fmtDate(m.currentPeriodEnd).toUpperCase()} · WILL NOT RENEW</p>
              ) : m.autoRenews ? (
                <p>RENEWS {fmtDate(m.currentPeriodEnd).toUpperCase()} · CARD</p>
              ) : (
                <p>ACTIVE UNTIL {fmtDate(m.currentPeriodEnd).toUpperCase()} · RENEW ANY TIME</p>
              )}
              {m.bonusTier && m.bonusUntil && new Date(m.bonusUntil) > new Date() && (
                <p className="flex items-center gap-2 text-ic-gold"><ArrowUpRight size={12} /> UPGRADED FROM {m.tier.toUpperCase()} AT NO EXTRA COST UNTIL {fmtDate(m.bonusUntil).toUpperCase()}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {!m.autoRenews && !m.cancelAtPeriodEnd && <Link href="/membership" className="btn-primary px-6 py-2.5 text-xs">RENEW OR UPGRADE</Link>}
              {m.cancelAtPeriodEnd ? (
                <button onClick={resume} className="btn-primary px-6 py-2.5 text-xs">KEEP MY MEMBERSHIP</button>
              ) : (
                <button
                  onClick={() => openChat({ topic: 'membership' })}
                  className="font-mono text-[10px] tracking-widest text-ic-muted hover:text-white border border-ic-border hover:border-ic-muted px-5 py-2.5 transition-colors"
                >
                  CHANGE OR CANCEL
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Perks */}
      <section className="border border-ic-border p-6 md:p-8">
        <p className="section-label mb-4 flex items-center gap-2"><Gift size={12} /> YOUR PERKS</p>
        {data.offers.length === 0 ? (
          <p className="text-ic-muted text-sm">No saved discounts right now.</p>
        ) : (
          <ul className="space-y-3">
            {data.offers.map(o => (
              <li key={o.id} className="border border-ic-gold/30 bg-ic-gold/5 p-3">
                <p className="font-bebas text-xl text-ic-gold">{o.percent}% OFF YOUR NEXT {o.kind === 'event_discount' ? 'EVENT' : 'RENEWAL'}</p>
                <p className="font-mono text-[9px] tracking-widest text-ic-muted">APPLIED AUTOMATICALLY AT CHECKOUT{o.expires_at ? ` · UNTIL ${fmtDate(o.expires_at).toUpperCase()}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => openChat({ topic: 'general' })}
          className="mt-6 w-full flex items-center justify-center gap-2 border border-ic-border hover:border-ic-gold text-ic-silver hover:text-ic-gold py-3 font-mono text-[10px] tracking-widest transition-colors"
        >
          <MessageCircle size={14} /> TALK TO THE TEAM
        </button>
      </section>

      {/* Tickets */}
      <section className="lg:col-span-3 border border-ic-border p-6 md:p-8">
        <p className="section-label mb-4 flex items-center gap-2"><Ticket size={12} /> YOUR TICKETS</p>
        {upcoming.length === 0 ? (
          <p className="text-ic-muted text-sm">No upcoming tickets. <Link href="/events" className="text-ic-gold hover:underline">See what&apos;s next →</Link></p>
        ) : (
          <ul className="divide-y divide-ic-border">
            {upcoming.map(t => (
              <li key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <Link href={`/events/${t.event!.id}`} className="font-bebas text-2xl text-white hover:text-ic-gold">{t.event!.title}</Link>
                  <p className="font-mono text-[10px] tracking-widest text-ic-muted">{fmtDate(t.event!.date).toUpperCase()} · {t.event!.location.toUpperCase()}</p>
                </div>
                <button
                  onClick={() => openChat({ topic: 'ticket', ticketId: t.id })}
                  className="font-mono text-[10px] tracking-widest text-ic-muted hover:text-white border border-ic-border hover:border-ic-muted px-4 py-2 transition-colors self-start sm:self-auto"
                >
                  CAN&apos;T MAKE IT?
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.refunds.length > 0 && (
        <section className="lg:col-span-3 border border-ic-border p-6">
          <p className="section-label mb-3">REFUND REQUESTS</p>
          <ul className="space-y-2 font-mono text-[11px] tracking-widest text-ic-muted">
            {data.refunds.map(r => (
              <li key={r.id}>
                {r.kind.toUpperCase()} · {r.currency === 'NGN' ? '₦' : '$'}{Number(r.amount).toLocaleString()} · {r.status.toUpperCase()}
                {r.status === 'requested' && ` · BY ${fmtDate(r.due_at).toUpperCase()}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
