'use client';

import { useState } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { PaymentButton } from '@/components/ui/PaymentButton';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import { Lock, MapPin, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Currency = 'USD' | 'NGN';

export function EventDetail({ event }: { event: Event }) {
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [qty,      setQty]      = useState(1);

  const spotsLeft = Math.max(0, event.capacity - event.sold);
  const isPast    = new Date(event.date) < new Date();
  const price     = currency === 'USD' ? event.priceUSD : event.priceNGN;
  const total     = price * qty;

  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      <div className="pt-24 pb-0 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/events" className="flex items-center gap-2 text-od-muted hover:text-od-gold font-mono text-xs tracking-widest transition-colors mb-12">
            <ArrowLeft size={12} /> ALL EVENTS
          </Link>
        </div>
      </div>

      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Event Info */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-6">
              {event.isVip && <span className="badge-live">VIP</span>}
              {event.isSecret && (
                <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-od-muted border border-od-border px-3 py-1">
                  <Lock size={8} /> SECRET LOCATION
                </span>
              )}
            </div>

            <h1
              className="font-bebas text-white leading-none mb-4"
              style={{ fontSize: 'clamp(40px, 8vw, 100px)' }}
            >
              {event.title}
            </h1>

            <div className="gold-divider mb-8" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              <div>
                <p className="section-label mb-2">DATE</p>
                <p className="font-space text-white text-sm">{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="section-label mb-2">LOCATION</p>
                <p className="font-space text-white text-sm">{event.location}</p>
                {event.venue && (
                  <p className="font-mono text-[10px] text-od-muted mt-0.5">{event.venue}</p>
                )}
              </div>
              <div>
                <p className="section-label mb-2">CAPACITY</p>
                <p className="font-space text-od-gold text-sm font-semibold">{spotsLeft} / {event.capacity} SPOTS LEFT</p>
              </div>
            </div>

            <p className="text-od-silver leading-relaxed mb-10">{event.description}</p>

            <div className="border border-od-border p-8 mb-8">
              <p className="section-label mb-6">TIME UNTIL EVENT</p>
              <CountdownTimer targetDate={event.date} />
            </div>

            {event.isSecret && (
              <div className="border border-od-gold/20 bg-od-gold/5 p-6">
                <div className="flex items-start gap-4">
                  <Lock size={18} className="text-od-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bebas text-od-gold text-lg mb-1">SECRET LOCATION</p>
                    <p className="text-od-muted text-sm">
                      Exact address revealed 24 hours before the event via email + member dashboard. Ticket holders only.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Card */}
          <div className="lg:col-span-1">
            <div className="border border-od-border bg-od-dark p-8 sticky top-24">
              <p className="section-label mb-6">GET YOUR TICKET</p>

              {/* Currency toggle */}
              <div className="flex border border-od-border mb-6">
                {(['NGN', 'USD'] as Currency[]).map(cur => (
                  <button
                    key={cur}
                    onClick={() => setCurrency(cur)}
                    className={`flex-1 py-2 font-mono text-xs tracking-widest transition-all ${
                      currency === cur ? 'bg-od-gold text-black' : 'text-od-muted hover:text-white'
                    }`}
                  >
                    {cur === 'NGN' ? '₦ NGN' : '$ USD'}
                  </button>
                ))}
              </div>

              {/* Price + Qty */}
              <div className="mb-6 pb-6 border-b border-od-border">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-od-muted text-sm">Per ticket</span>
                  <span className="font-bebas text-2xl text-od-gold">
                    {event.priceNGN === 0 ? 'FREE' : (currency === 'NGN' ? `₦${price.toLocaleString()}` : `$${price}`)}
                  </span>
                </div>

                {event.priceNGN > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-od-muted text-sm">Quantity</span>
                      <div className="flex items-center border border-od-border">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 text-od-muted hover:text-white flex items-center justify-center">−</button>
                        <span className="w-8 text-center font-mono text-sm">{qty}</span>
                        <button onClick={() => setQty(q => Math.min(Math.min(4, spotsLeft), q + 1))} className="w-9 h-9 text-od-muted hover:text-white flex items-center justify-center">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-xs text-od-muted">TOTAL</span>
                      <span className="font-bebas text-3xl text-od-gold">
                        {currency === 'NGN' ? `₦${total.toLocaleString()}` : `$${total}`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Capacity bar */}
              <div className="mb-6">
                <div className="flex justify-between text-[10px] font-mono text-od-muted mb-2">
                  <span>{spotsLeft} SPOTS LEFT</span>
                  <span>{Math.round((event.sold / event.capacity) * 100)}% FILLED</span>
                </div>
                <div className="h-1 bg-od-border">
                  <div className="h-1 bg-od-gold transition-all" style={{ width: `${(event.sold / event.capacity) * 100}%` }} />
                </div>
              </div>

              {/* Payment CTA — coming soon */}
              {isPast ? (
                <div className="w-full border border-od-border py-4 text-center font-bebas tracking-widest text-od-muted">
                  THIS EVENT HAS ENDED
                </div>
              ) : spotsLeft <= 0 ? (
                <div className="w-full border border-od-red/40 py-4 text-center font-bebas tracking-widest text-od-red">
                  SOLD OUT
                </div>
              ) : (
                <PaymentButton label="BUY TICKET" />
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
