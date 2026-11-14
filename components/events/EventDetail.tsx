'use client';

import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { CheckoutOptions } from '@/components/checkout/CheckoutOptions';
import { EventPoster } from '@/components/art/EventPoster';
import type { PaymentMethods } from '@/lib/payments/config';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';
import { Lock, MapPin, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';


export function EventDetail({ event, methods }: { event: Event; methods: PaymentMethods }) {

  const spotsLeft = Math.max(0, event.capacity - event.sold);
  const isPast    = new Date(event.date) < new Date();

  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />

      <div className="pt-24 pb-0 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/events" className="flex items-center gap-2 text-ic-muted hover:text-ic-gold font-mono text-xs tracking-widest transition-colors mb-12">
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
                <span className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-ic-muted border border-ic-border px-3 py-1">
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
                  <p className="font-mono text-[11px] text-ic-muted mt-0.5">{event.venue}</p>
                )}
              </div>
              <div>
                <p className="section-label mb-2">CAPACITY</p>
                <p className="font-space text-ic-gold text-sm font-semibold">{spotsLeft} / {event.capacity} SPOTS LEFT</p>
              </div>
            </div>

            <p className="text-ic-silver leading-relaxed mb-10">{event.description}</p>

            <div className="border border-ic-border p-8 mb-8">
              <p className="section-label mb-6">TIME UNTIL EVENT</p>
              <CountdownTimer targetDate={event.date} />
            </div>

            {event.isSecret && (
              <div className="border border-ic-gold/20 bg-ic-gold/5 p-6">
                <div className="flex items-start gap-4">
                  <Lock size={18} className="text-ic-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bebas text-ic-gold text-lg mb-1">SECRET LOCATION</p>
                    <p className="text-ic-muted text-sm">
                      Exact address revealed 24 hours before the event via email + member dashboard. Ticket holders only.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Card */}
          <div className="lg:col-span-1 space-y-6">
            <EventPoster title={event.title} type={event.type} date={event.date} location={event.location} imageUrl={event.imageUrl} />
            <div className="border border-ic-border bg-ic-dark p-8">
              <p className="section-label mb-6">GET YOUR TICKET</p>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-ic-border flex justify-between items-baseline">
                <span className="text-ic-muted text-sm">Per ticket</span>
                <span className="font-bebas text-3xl text-ic-gold text-right">
                  {event.priceUSD === 0 && event.priceNGN === 0
                    ? 'FREE'
                    : [event.priceUSD > 0 && `$${event.priceUSD}`, event.priceNGN > 0 && `₦${event.priceNGN.toLocaleString('en-NG')}`]
                        .filter(Boolean).join(' / ')}
                </span>
              </div>

              {/* Capacity bar */}
              <div className="mb-6">
                <div className="flex justify-between text-[11px] font-mono text-ic-muted mb-2">
                  <span>{spotsLeft} SPOTS LEFT</span>
                  <span>{Math.round((event.sold / event.capacity) * 100)}% FILLED</span>
                </div>
                <div className="h-1 bg-ic-border">
                  <div className="h-1 bg-ic-gold transition-all" style={{ width: `${(event.sold / event.capacity) * 100}%` }} />
                </div>
              </div>

              {/* Payment CTA — coming soon */}
              {isPast ? (
                <div className="w-full border border-ic-border py-4 text-center font-bebas tracking-widest text-ic-muted">
                  THIS EVENT HAS ENDED
                </div>
              ) : spotsLeft <= 0 ? (
                <div className="w-full border border-ic-red/40 py-4 text-center font-bebas tracking-widest text-ic-red">
                  SOLD OUT
                </div>
              ) : (
                <CheckoutOptions
                  product={{ kind: 'ticket', eventId: event.id }}
                  methods={methods}
                  priceUSD={event.priceUSD}
                  priceNGN={event.priceNGN}
                />
              )}
              {event.minTier && (
                <p className="font-mono text-[10px] tracking-widest text-ic-muted mt-3 text-center">
                  REQUIRES AN ACTIVE {event.minTier.toUpperCase()}+ MEMBERSHIP
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
