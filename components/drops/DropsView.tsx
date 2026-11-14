'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Lock, Zap, Clock, Loader2 } from 'lucide-react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { EventPoster } from '@/components/art/EventPoster';
import { CircleField } from '@/components/art/CircleField';
import { CheckoutOptions } from '@/components/checkout/CheckoutOptions';
import type { DropView } from '@/lib/drops';
import type { PaymentMethods } from '@/lib/payments/config';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();

export function DropsView({ drops: initial, methods }: { drops: DropView[]; methods: PaymentMethods }) {
  const [drops, setDrops]         = useState(initial);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [unlocked, setUnlocked]   = useState<Record<string, string>>({}); // dropId -> verified password
  const [buying, setBuying]       = useState<string | null>(null);
  const [checking, setChecking]   = useState<string | null>(null);

  async function unlock(dropId: string) {
    const password = passwords[dropId]?.trim();
    if (!password) return;
    setChecking(dropId);
    try {
      const res = await fetch('/api/drops/unlock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dropId, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.error ?? 'Wrong password'); return; }
      setDrops(ds => ds.map(d => (d.id === dropId ? body.drop : d)));
      setUnlocked(u => ({ ...u, [dropId]: password }));
      toast.success('Access granted.');
    } finally {
      setChecking(null);
    }
  }

  const now = Date.now();

  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />

      <section className="relative isolate overflow-hidden pt-32 pb-20 px-6">
        <CircleField className="absolute -z-10 -right-[25vmin] top-1/2 -translate-y-1/2 w-[100vmin] h-[100vmin]" />
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-4">LIMITED RELEASES</p>
          <h1 className="font-bebas gold-text leading-none mb-6" style={{ fontSize: 'clamp(60px, 14vw, 160px)' }}>DROPS</h1>
          <p className="text-ic-silver max-w-xl leading-relaxed">No restocks. No reposts. No apologies. One per member.</p>
          <div className="flex items-center gap-4 mt-6">
            <Zap size={12} className="text-ic-gold" />
            <p className="font-mono text-[11px] tracking-[0.3em] text-ic-muted">DROPS ARE ANNOUNCED TO MEMBERS FIRST</p>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 border-t border-ic-border">
        {drops.length === 0 ? (
          <div className="max-w-3xl mx-auto border border-ic-border p-10 md:p-16 text-center">
            <p className="font-bebas text-3xl md:text-5xl text-white mb-3">THE VAULT IS CLOSED</p>
            <p className="text-ic-muted text-sm mb-8">The next drop goes to members first. Make sure you&apos;re one of them.</p>
            <Link href="/membership" className="btn-primary px-10 py-3 text-sm">BECOME A MEMBER</Link>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drops.map(drop => {
              const left    = drop.quantity - drop.sold;
              const pct     = Math.min(100, (drop.sold / drop.quantity) * 100);
              const live    = new Date(drop.dropDate).getTime() <= now;
              const ended   = Boolean(drop.endsAt && new Date(drop.endsAt).getTime() < now);
              const soldOut = left <= 0;
              const locked  = drop.isPasswordProtected && !unlocked[drop.id];

              return (
                <article key={drop.id} className="border border-ic-border bg-ic-dark/40 flex flex-col">
                  <div className="relative">
                    <EventPoster title={drop.redacted ? `CLASSIFIED ${drop.id.slice(0, 4)}` : drop.name} type={drop.type}
                      date={drop.dropDate} location={drop.minTier ? `${drop.minTier.toUpperCase()}+ ONLY` : 'MEMBERS'}
                      imageUrl={drop.imageUrl} className="border-0 border-b" />
                    {locked && (
                      <div className="absolute inset-0 bg-ic-black/70 backdrop-blur-sm flex items-center justify-center">
                        <Lock size={36} className="text-ic-red" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 font-mono text-[10px] tracking-widest">
                      {soldOut ? <span className="text-ic-red border border-ic-red/40 px-2 py-0.5">SOLD OUT</span>
                        : ended ? <span className="text-ic-muted border border-ic-border px-2 py-0.5">ENDED</span>
                        : live ? <span className="badge-live">LIVE</span>
                        : <span className="flex items-center gap-1 text-ic-gold border border-ic-gold/40 px-2 py-0.5"><Clock size={10} /> {fmt(drop.dropDate)}</span>}
                      {drop.minTier && <span className="text-ic-muted">{drop.minTier.toUpperCase()}+</span>}
                    </div>

                    <h2 className="font-bebas text-2xl text-white mb-2">{drop.name}</h2>
                    <p className="text-ic-muted text-sm leading-relaxed mb-5 flex-1">{drop.description}</p>

                    <div className="mb-5">
                      <div className="flex justify-between text-[11px] font-mono text-ic-muted mb-1">
                        <span>{soldOut ? 'ALL GONE' : `${left} OF ${drop.quantity} LEFT`}</span>
                        <span>{Math.round(pct)}% CLAIMED</span>
                      </div>
                      <div className="h-px bg-ic-border"><div className="h-px bg-ic-gold" style={{ width: `${pct}%` }} /></div>
                    </div>

                    {!live && !soldOut ? (
                      <div>
                        <p className="section-label mb-2">DROPS IN</p>
                        <CountdownTimer targetDate={drop.dropDate} compact />
                      </div>
                    ) : soldOut || ended ? null : locked ? (
                      <form onSubmit={e => { e.preventDefault(); unlock(drop.id); }} className="flex gap-2">
                        <input
                          type="password"
                          value={passwords[drop.id] ?? ''}
                          onChange={e => setPasswords(p => ({ ...p, [drop.id]: e.target.value }))}
                          placeholder="Password"
                          aria-label="Drop password"
                          className="flex-1 bg-ic-black border border-ic-border text-white text-sm px-3 py-2 focus:outline-none focus:border-ic-gold"
                        />
                        <button className="border border-ic-gold text-ic-gold px-4 font-mono text-[11px] tracking-widest flex items-center gap-1">
                          {checking === drop.id && <Loader2 size={12} className="animate-spin" />} UNLOCK
                        </button>
                      </form>
                    ) : buying === drop.id ? (
                      <CheckoutOptions
                        product={{ kind: 'drop', dropId: drop.id, password: unlocked[drop.id] }}
                        methods={methods}
                        priceUSD={drop.priceUSD}
                        priceNGN={drop.priceNGN}
                      />
                    ) : (
                      <button onClick={() => setBuying(drop.id)} className="btn-primary w-full py-3 text-sm justify-center">
                        SECURE IT — {drop.priceNGN ? `₦${drop.priceNGN.toLocaleString('en-NG')}` : ''}{drop.priceNGN && drop.priceUSD ? ' / ' : ''}{drop.priceUSD ? `$${drop.priceUSD}` : ''}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
