'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { MapPin, Users, Lock, ArrowRight } from 'lucide-react';
import type { Event } from '@/types';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatPrice, formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  listening_party: 'LISTENING PARTY',
  show:            'UNDERGROUND SHOW',
  hangout:         'FAN HANGOUT',
  studio:          'STUDIO SESSION',
  industry:        'INDUSTRY EVENT',
  secret:          'SECRET EVENT',
};

const TYPE_COLORS: Record<string, string> = {
  listening_party: '#C9A84C',
  show:            '#CC0000',
  hangout:         '#9CA3AF',
  studio:          '#FFFFFF',
  industry:        '#C9A84C',
  secret:          '#CC0000',
};

export function EventsShowcase({ events }: { events: Event[] }) {
  const sectionRef    = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const [featured, ...others] = events;
  const rest      = others.slice(0, 2);
  const spotsLeft = featured ? featured.capacity - featured.sold : 0;
  const pct       = featured ? Math.min(100, (featured.sold / featured.capacity) * 100) : 0;

  return (
    <section ref={sectionRef} className="py-24 bg-od-dark/30">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-4"
          initial={{ opacity: 0, x: -30 }}
          animate={sectionInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">EVENTS</p>
          <div className="h-px flex-1 bg-od-border" />
          <Link
            href="/events"
            className="font-mono text-[10px] tracking-widest text-od-muted hover:text-od-gold transition-colors"
          >
            ALL EVENTS →
          </Link>
        </motion.div>

        <div className="overflow-hidden mb-12">
          <motion.h2
            className="font-bebas text-white leading-none"
            style={{ fontSize: 'clamp(48px, 10vw, 130px)' }}
            initial={{ y: '110%' }}
            animate={sectionInView ? { y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            WHAT&apos;S NEXT
          </motion.h2>
        </div>

        {!featured ? (
          <div className="border border-od-border p-10 md:p-16 text-center">
            <p className="font-bebas text-3xl md:text-5xl text-white mb-3">NEXT EVENTS ANNOUNCED SOON</p>
            <p className="text-od-muted text-sm mb-8">Members hear first. Get on the list so you don&apos;t miss the drop.</p>
            <Link href="/join" className="btn-primary px-10 py-3 text-sm">GET NOTIFIED</Link>
          </div>
        ) : (
        /* Two-column grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Featured event — 7/12 cols */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 40 }}
            animate={sectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              href={`/events/${featured.id}`}
              className="group block relative border border-od-border hover:border-od-gold/50 overflow-hidden h-full transition-all duration-500"
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse at top right, rgba(201,168,76,0.08) 0%, transparent 60%),
                    linear-gradient(180deg, #111111 0%, #080808 100%)
                  `,
                }}
              />

              {/* Scanline strip at top */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${TYPE_COLORS[featured.type]}, transparent)`,
                }}
              />

              <div className="relative z-10 p-8 md:p-12 flex flex-col min-h-[420px]">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <span
                    className="font-mono text-[9px] tracking-[0.3em] border px-3 py-1"
                    style={{ color: TYPE_COLORS[featured.type], borderColor: TYPE_COLORS[featured.type] }}
                  >
                    {TYPE_LABELS[featured.type]}
                  </span>
                  {featured.isVip && (
                    <span className="badge-live text-[9px] px-3 py-1">VIP</span>
                  )}
                  {featured.isSecret && (
                    <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-od-muted border border-od-border px-2 py-1">
                      <Lock size={8} /> SECRET
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3
                  className="font-bebas text-white leading-none mb-4 group-hover:text-od-gold transition-colors duration-400"
                  style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}
                >
                  {featured.title}
                </h3>
                <p className="text-od-muted text-sm mb-6 max-w-md leading-relaxed">
                  {featured.description}
                </p>

                {/* Location + spots */}
                <div className="flex flex-wrap gap-6 text-xs font-mono text-od-muted mb-6">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={10} /> {featured.location}
                    {featured.venue && ` — ${featured.venue}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={10} />
                    {spotsLeft <= 0
                      ? <span className="text-od-red">SOLD OUT</span>
                      : <span className="text-od-gold">{spotsLeft} SPOTS LEFT</span>
                    }
                  </span>
                </div>

                {/* Capacity bar */}
                <div className="h-px bg-od-border mb-8">
                  <div
                    className="h-px bg-od-gold transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Bottom row */}
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <CountdownTimer targetDate={featured.date} compact />
                    <p className="font-mono text-[9px] tracking-widest text-od-muted mt-1">
                      {formatDate(featured.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bebas text-2xl text-od-gold">
                      {featured.priceNGN === 0 ? 'MEMBERS FREE' : formatPrice(featured.priceNGN, 'NGN')}
                    </p>
                    <p className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-od-muted group-hover:text-od-gold transition-colors">
                      GET TICKETS <ArrowRight size={10} />
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Secondary events — 5/12 cols */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {rest.map((event, i) => {
              const sl  = event.capacity - event.sold;
              const pct = (event.sold / event.capacity) * 100;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={sectionInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.12 }}
                  className="flex-1"
                >
                  <Link
                    href={`/events/${event.id}`}
                    className="group block border border-od-border hover:border-od-gold/40 bg-od-gray/20 hover:bg-od-gray/40 p-6 h-full transition-all duration-400"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-3xl font-bold text-od-border group-hover:text-od-gold/30 transition-colors tabular-nums flex-shrink-0">
                        {String(i + 2).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-mono text-[9px] tracking-widest mb-1"
                          style={{ color: TYPE_COLORS[event.type] }}
                        >
                          {TYPE_LABELS[event.type]}
                        </p>
                        <h4 className="font-bebas text-xl text-white group-hover:text-od-gold transition-colors leading-tight mb-2">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-od-muted mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin size={8} /> {event.location}
                          </span>
                          {sl <= 0
                            ? <span className="text-od-red">SOLD OUT</span>
                            : <span className="text-od-gold">{sl} LEFT</span>
                          }
                        </div>

                        {/* Capacity bar */}
                        <div className="h-px bg-od-border mb-3">
                          <div
                            className="h-px bg-od-gold/60"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] tracking-widest text-od-muted">
                            {formatDate(event.date)}
                          </p>
                          <p className="font-bebas text-lg text-od-gold">
                            {event.priceNGN === 0 ? 'FREE' : formatPrice(event.priceNGN, 'NGN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* View all */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={sectionInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
            >
              <Link
                href="/events"
                className="block border border-od-border hover:border-od-gold bg-transparent hover:bg-od-gray/20 p-6 text-center font-mono text-xs tracking-widest text-od-muted hover:text-od-gold transition-all duration-300"
              >
                VIEW ALL EVENTS →
              </Link>
            </motion.div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
