'use client';

import { useState } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatPrice, formatDate, getTimeUntil } from '@/lib/utils';
import { UPCOMING_EVENTS } from '@/lib/constants';
import { Lock, MapPin, Users, Ticket, Filter } from 'lucide-react';
import Link from 'next/link';

const ALL_EVENTS = [
  ...UPCOMING_EVENTS,
  {
    id: 'show-london-past', title: 'ALARA FEST — LAGOS', type: 'show' as const,
    date: '2025-12-15T21:00:00', location: 'Lagos, Nigeria', venue: 'Eko Convention Centre',
    description: 'The biggest night of the year. 3,000 in attendance.',
    priceUSD: 60, priceNGN: 90000, capacity: 3000, sold: 3000, isVip: false, isSecret: false,
  },
  {
    id: 'studio-001', title: 'STUDIO SESSION — WINNER', type: 'studio' as const,
    date: '2026-08-02T14:00:00', location: 'Lagos, Nigeria', venue: 'Native Records HQ',
    description: 'Raffle winner gets to observe a full session. WARLORD members only.',
    priceUSD: 0, priceNGN: 0, capacity: 5, sold: 0, isVip: true, isSecret: true,
    minTier: 'warlord' as const,
  },
  {
    id: 'industry-001', title: 'CREATIVE INDUSTRY NIGHT', type: 'industry' as const,
    date: '2026-08-20T19:00:00', location: 'Lagos, Nigeria', venue: 'TBA',
    description: 'Producers, creatives, filmmakers, designers. INDUSTRY tier only.',
    priceUSD: 0, priceNGN: 0, capacity: 40, sold: 0, isVip: true, isSecret: true,
    minTier: 'industry' as const,
  },
];

const TYPE_LABELS: Record<string, string> = {
  listening_party: 'LISTENING PARTY',
  show:            'UNDERGROUND SHOW',
  hangout:         'FAN HANGOUT',
  studio:          'STUDIO SESSION',
  industry:        'INDUSTRY EVENT',
  secret:          'SECRET EVENT',
};

const TIER_COLORS: Record<string, string> = {
  machine:  '#9CA3AF',
  insider:  '#C9A84C',
  warlord:  '#CC0000',
  industry: '#FFFFFF',
};

export default function EventsPage() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? ALL_EVENTS
    : ALL_EVENTS.filter(e => e.type === filter);

  const types = ['all', ...new Set(ALL_EVENTS.map(e => e.type))];

  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-4">CALENDAR</p>
          <h1
            className="font-bebas gold-text leading-none mb-4"
            style={{ fontSize: 'clamp(60px, 14vw, 160px)' }}
          >
            EVENTS
          </h1>
          <p className="text-od-silver max-w-lg">
            Private shows. Listening parties. Studio sessions. Hangouts. Underground culture at every level.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-y border-od-border px-6 py-4 sticky top-16 md:top-20 z-30 bg-od-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto pb-1">
          <Filter size={14} className="text-od-muted flex-shrink-0" />
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`font-mono text-[10px] tracking-widest px-4 py-2 flex-shrink-0 border transition-all ${
                filter === type
                  ? 'border-od-gold text-od-gold bg-od-gold/10'
                  : 'border-od-border text-od-muted hover:border-od-muted hover:text-white'
              }`}
            >
              {type === 'all' ? 'ALL' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {/* Events List */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {filtered.map((event, i) => {
            const spotsLeft = event.capacity - event.sold;
            const pct       = (event.sold / event.capacity) * 100;
            const isSoldOut = spotsLeft <= 0;
            const isPast    = new Date(event.date) < new Date();
            const tierColor = (event as any).minTier ? TIER_COLORS[(event as any).minTier] : undefined;

            return (
              <div
                key={event.id}
                className={`border transition-all duration-300 ${
                  isPast
                    ? 'border-od-border/30 opacity-50'
                    : 'border-od-border hover:border-od-gold/40 bg-od-dark/20'
                }`}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Left: Number + Labels */}
                    <div className="flex items-center gap-4 md:flex-col md:items-center md:w-20 flex-shrink-0">
                      <span className="font-mono text-3xl font-bold text-od-border">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {event.isVip && (
                          <span className="badge-live text-[8px] px-1.5 py-0.5">VIP</span>
                        )}
                        {event.isSecret && (
                          <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest text-od-muted border border-od-border px-1.5 py-0.5">
                            <Lock size={7} /> SECRET
                          </span>
                        )}
                        {isPast && (
                          <span className="font-mono text-[8px] tracking-widest text-od-muted border border-od-border px-1.5 py-0.5">
                            PAST
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-mono text-[9px] tracking-widest text-od-muted mb-1">
                            {TYPE_LABELS[event.type]}
                          </p>
                          <h2 className="font-bebas text-2xl md:text-3xl text-white">
                            {event.title}
                          </h2>
                        </div>
                        {tierColor && (
                          <div
                            className="font-mono text-[9px] tracking-widest px-2 py-1 border flex-shrink-0"
                            style={{ borderColor: `${tierColor}40`, color: tierColor }}
                          >
                            {(event as any).minTier?.toUpperCase()}+ ONLY
                          </div>
                        )}
                      </div>

                      <p className="text-od-muted text-sm mb-4">{event.description}</p>

                      <div className="flex flex-wrap gap-6 text-xs font-mono text-od-muted mb-4">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={10} />
                          {event.location}{event.venue ? ` — ${event.venue}` : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={10} />
                          {isSoldOut
                            ? <span className="text-od-red">SOLD OUT</span>
                            : <span className="text-od-gold">{spotsLeft} SPOTS LEFT</span>
                          }
                          {' '}/ {event.capacity}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Ticket size={10} />
                          {event.priceNGN === 0
                            ? 'FREE FOR MEMBERS'
                            : formatPrice(event.priceNGN, 'NGN')
                          }
                        </span>
                      </div>

                      {/* Capacity bar */}
                      <div className="w-full h-px bg-od-border mb-4">
                        <div
                          className={`h-px transition-all ${isSoldOut ? 'bg-od-red' : 'bg-od-gold'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Right: Date + CTA */}
                    <div className="md:text-right flex-shrink-0 md:w-40">
                      <p className="font-mono text-[9px] tracking-widest text-od-muted mb-1">
                        {formatDate(event.date)}
                      </p>
                      {!isPast && (
                        <div className="mb-4">
                          <CountdownTimer targetDate={event.date} compact />
                        </div>
                      )}

                      {isPast ? (
                        <span className="font-mono text-xs text-od-muted">COMPLETED</span>
                      ) : isSoldOut ? (
                        <span className="inline-block border border-od-red text-od-red font-mono text-xs px-4 py-2 tracking-widest">
                          SOLD OUT
                        </span>
                      ) : (
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-block btn-primary py-3 px-6 text-xs"
                        >
                          GET TICKETS
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}
