'use client';

import { useState } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { PaymentButton } from '@/components/ui/PaymentButton';
import toast from 'react-hot-toast';

const DROPS = [
  {
    id: 'd-001', name: 'INDUSTRY MACHINE TEE — VOL. 1', type: 'merch',
    description: 'Heavyweight 350gsm. Embroidered ⚙️. Limited to 200 units. No restock.',
    priceNGN: 45000, priceUSD: 30, quantity: 200, sold: 174,
    dropDate: '2026-06-01T12:00:00', isPasswordProtected: false, isSecret: false,
    color: '#C9A84C',
  },
  {
    id: 'd-002', name: 'WARLORD SEASON — UNRELEASED EP', type: 'music',
    description: 'Three tracks recorded but never released. Digital download only. INSIDER+ members.',
    priceNGN: 8000, priceUSD: 5, quantity: 500, sold: 312,
    dropDate: '2026-06-20T00:00:00', isPasswordProtected: false, isSecret: false,
    minTier: 'insider', color: '#C9A84C',
  },
  {
    id: 'd-003', name: '[CLASSIFIED] — RESTRICTED DROP', type: 'merch',
    description: '????',
    priceNGN: 0, priceUSD: 0, quantity: 50, sold: 0,
    dropDate: '2026-07-07T07:07:00', isPasswordProtected: true, isSecret: true,
    minTier: 'warlord', color: '#CC0000',
  },
  {
    id: 'd-004', name: 'INNER CIRCLE HOODIE — BLACK', type: 'merch',
    description: 'Thick cotton. No logos on the front. Just the ⚙️ on the chest. 300 units.',
    priceNGN: 65000, priceUSD: 42, quantity: 300, sold: 289,
    dropDate: '2026-05-15T10:00:00', isPasswordProtected: false, isSecret: false,
    color: '#9CA3AF',
  },
  {
    id: 'd-005', name: 'NATIVE RECORDS INVITATIONAL PASS', type: 'invite',
    description: 'INDUSTRY tier only. Physical printed invite to the Native Records end-of-year event.',
    priceNGN: 0, priceUSD: 0, quantity: 30, sold: 22,
    dropDate: '2026-08-01T09:00:00', isPasswordProtected: false, isSecret: false,
    minTier: 'industry', color: '#FFFFFF',
  },
];

const TYPE_ICONS: Record<string, string> = {
  merch: '👕',
  music: '🎵',
  invite: '📜',
  ticket: '🎟️',
};

export default function DropsPage() {
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [revealed,  setRevealed]  = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState<string | null>(null);

  // Payments integration coming soon — placeholder handler
  const handleBuy = (_dropId: string) => {};

  const handlePasswordReveal = (dropId: string) => {
    if (passwords[dropId] === 'WARLORD') {
      setRevealed(r => ({ ...r, [dropId]: true }));
      toast.success('Access granted. The drop is revealed.');
    } else {
      toast.error('Wrong password. You know what you need.');
    }
  };

  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-4">LIMITED RELEASES</p>
          <h1
            className="font-bebas gold-text leading-none mb-6"
            style={{ fontSize: 'clamp(60px, 14vw, 160px)' }}
          >
            DROPS
          </h1>
          <p className="text-od-silver max-w-xl leading-relaxed">
            No restocks. No reposts. No apologies. You snooze, you miss.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <Zap size={12} className="text-od-gold" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-od-muted">
              DROPS ARE ANNOUNCED EXCLUSIVELY TO MEMBERS FIRST
            </p>
          </div>
        </div>
      </section>

      {/* Drops Grid */}
      <section className="py-12 px-6 border-t border-od-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DROPS.map(drop => {
            const spotsLeft  = drop.quantity - drop.sold;
            const pct        = (drop.sold / drop.quantity) * 100;
            const isSoldOut  = spotsLeft <= 0;
            const isLive     = new Date(drop.dropDate) <= new Date();
            const isSecret   = drop.isSecret && !revealed[drop.id];

            return (
              <div
                key={drop.id}
                className={`border flex flex-col transition-all duration-300 ${
                  isSoldOut ? 'border-od-border opacity-60' :
                  isSecret  ? 'border-od-red/30 bg-od-red/5' :
                  'border-od-border hover:border-od-gold/40 bg-od-dark/20 card-glow'
                }`}
              >
                {/* Image placeholder */}
                <div
                  className="aspect-square flex items-center justify-center relative overflow-hidden"
                  style={{ background: `rgba(${drop.color === '#C9A84C' ? '201,168,76' : drop.color === '#CC0000' ? '204,0,0' : '255,255,255'},0.05)` }}
                >
                  {isSecret ? (
                    <div className="text-center">
                      <p className="text-6xl mb-4">🔒</p>
                      <p className="font-mono text-[10px] tracking-widest text-od-muted">PASSWORD REQUIRED</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-6xl mb-2">{TYPE_ICONS[drop.type]}</p>
                      <p className="font-mono text-[9px] tracking-widest text-od-muted">{drop.type.toUpperCase()}</p>
                    </div>
                  )}

                  {isSoldOut && (
                    <div className="absolute inset-0 bg-od-black/60 flex items-center justify-center">
                      <p className="font-bebas text-4xl text-od-red">SOLD OUT</p>
                    </div>
                  )}

                  {!isLive && !isSecret && (
                    <div className="absolute bottom-0 left-0 right-0 bg-od-black/80 p-3 text-center">
                      <p className="font-mono text-[9px] tracking-widest text-od-muted mb-1">DROPS IN</p>
                      <CountdownTimer targetDate={drop.dropDate} compact />
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  {/* Meta */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-mono text-[9px] tracking-widest px-2 py-0.5 border"
                      style={{ color: drop.color, borderColor: `${drop.color}40` }}
                    >
                      {drop.type.toUpperCase()}
                    </span>
                    {(drop as any).minTier && (
                      <span className="font-mono text-[9px] tracking-widest text-od-muted flex items-center gap-1">
                        <Lock size={8} /> {(drop as any).minTier.toUpperCase()}+
                      </span>
                    )}
                  </div>

                  <h3 className={`font-bebas text-xl mb-2 ${isSecret ? 'text-od-muted' : 'text-white'}`}>
                    {isSecret ? '[CLASSIFIED]' : drop.name}
                  </h3>

                  <p className={`text-sm leading-relaxed mb-4 flex-1 ${isSecret ? 'text-od-muted/50 blur-sm' : 'text-od-muted'}`}>
                    {drop.description}
                  </p>

                  {/* Availability bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-mono text-od-muted mb-1">
                      <span>{isSecret ? '???' : `${spotsLeft} LEFT`}</span>
                      <span>{isSecret ? '???' : `${Math.round(pct)}% GONE`}</span>
                    </div>
                    <div className="h-px bg-od-border">
                      {!isSecret && (
                        <div
                          className="h-px transition-all"
                          style={{ width: `${pct}%`, background: drop.color }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="font-mono text-xs text-od-muted">PRICE</span>
                    <span className="font-bebas text-2xl" style={{ color: drop.color }}>
                      {drop.priceNGN === 0 ? 'MEMBER ONLY' : `₦${drop.priceNGN.toLocaleString()}`}
                    </span>
                  </div>

                  {/* CTA */}
                  {isSecret ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type={revealed[`show-${drop.id}`] ? 'text' : 'password'}
                          placeholder="ENTER PASSWORD"
                          value={passwords[drop.id] || ''}
                          onChange={e => setPasswords(p => ({ ...p, [drop.id]: e.target.value }))}
                          className="flex-1 bg-od-dark border border-od-border text-white px-3 py-2 font-mono text-xs focus:border-od-red focus:outline-none tracking-widest placeholder:text-od-muted"
                        />
                        <button
                          onClick={() => setRevealed(r => ({ ...r, [`show-${drop.id}`]: !r[`show-${drop.id}`] }))}
                          className="border border-od-border text-od-muted hover:text-white p-2 transition-colors"
                        >
                          {revealed[`show-${drop.id}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        onClick={() => handlePasswordReveal(drop.id)}
                        className="w-full border border-od-red text-od-red py-2 font-bebas tracking-widest text-sm hover:bg-od-red hover:text-black transition-all"
                      >
                        UNLOCK
                      </button>
                    </div>
                  ) : isSoldOut ? (
                    <button disabled className="w-full border border-od-border text-od-muted py-3 font-bebas tracking-widest opacity-50 cursor-not-allowed">
                      SOLD OUT
                    </button>
                  ) : !isLive ? (
                    <button disabled className="w-full border border-od-border text-od-muted py-3 font-bebas tracking-widest opacity-50 cursor-not-allowed">
                      NOT LIVE YET
                    </button>
                  ) : (
                    <PaymentButton label="BUY NOW" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 border-t border-od-border px-6 text-center">
        <p className="section-label mb-4">DON'T MISS THE NEXT DROP</p>
        <h2 className="font-bebas text-4xl text-white mb-4">MEMBERS GET FIRST ACCESS.</h2>
        <p className="text-od-muted mb-8">Drops announced 48h early to INSIDER+ members. WARLORD+ gets password access to secret drops.</p>
        <a href="/membership" className="btn-primary px-12 py-4 inline-flex">JOIN THE INNER CIRCLE →</a>
      </section>

      <Footer />
    </main>
  );
}
