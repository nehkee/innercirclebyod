'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Lock, MapPin, Users } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UPCOMING_EVENTS } from '@/lib/constants';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatPrice, formatDate } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const TYPE_LABELS: Record<string, string> = {
  listening_party: 'LISTENING PARTY',
  show:            'UNDERGROUND SHOW',
  hangout:         'FAN HANGOUT',
  studio:          'STUDIO SESSION',
  industry:        'INDUSTRY EVENT',
  secret:          'SECRET EVENT',
};

export function EventsPreview() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-event-card]', {
        opacity: 0,
        y: 50,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-event-card]',
          start: 'top 85%',
          once: true,
        },
      });

      // Capacity bars animate in
      gsap.from('[data-capacity-bar]', {
        scaleX: 0,
        duration: 1.2,
        ease: 'power2.out',
        stagger: 0.1,
        transformOrigin: 'left center',
        scrollTrigger: {
          trigger: '[data-event-card]',
          start: 'top 80%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-od-dark/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">UPCOMING</p>
          <Link href="/events" className="font-mono text-[10px] tracking-widest text-od-muted hover:text-od-gold transition-colors">
            VIEW ALL →
          </Link>
        </div>

        <h2
          className="font-bebas text-white mb-16"
          style={{ fontSize: 'clamp(48px, 10vw, 120px)' }}
        >
          EVENTS
        </h2>

        {/* Events */}
        <div className="space-y-4">
          {UPCOMING_EVENTS.map((event, i) => {
            const spotsLeft = event.capacity - event.sold;
            const pct       = (event.sold / event.capacity) * 100;
            const isSoldOut = spotsLeft <= 0;

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                data-event-card
                className="group block border border-od-border hover:border-od-gold/40 bg-od-gray/20 hover:bg-od-gray/40 transition-all duration-400 p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Index + Type */}
                  <div className="flex items-center gap-4 md:w-48 flex-shrink-0">
                    <span className="font-mono text-4xl font-bold text-od-border group-hover:text-od-gold/30 transition-colors tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-mono text-[9px] tracking-widest text-od-muted mb-1">
                        {TYPE_LABELS[event.type]}
                      </p>
                      <div className="flex gap-2">
                        {event.isVip && <span className="badge-live text-[9px] px-2 py-0.5">VIP</span>}
                        {event.isSecret && (
                          <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-od-muted border border-od-border px-2 py-0.5">
                            <Lock size={8} /> SECRET
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title + Details */}
                  <div className="flex-1">
                    <h3 className="font-bebas text-2xl md:text-3xl text-white group-hover:text-od-gold transition-colors mb-2">
                      {event.title}
                    </h3>
                    <p className="text-od-muted text-sm mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-od-muted">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {event.location}
                        {event.venue && ` — ${event.venue}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {isSoldOut
                          ? <span className="text-od-red">SOLD OUT</span>
                          : <span className="text-od-gold">{spotsLeft} SPOTS LEFT</span>
                        }
                      </span>
                    </div>
                  </div>

                  {/* Right: Countdown + Price */}
                  <div className="md:text-right flex-shrink-0">
                    <CountdownTimer targetDate={event.date} compact />
                    <p className="font-mono text-[9px] tracking-widest text-od-muted mb-2">
                      {formatDate(event.date)}
                    </p>
                    <p className="font-bebas text-xl text-od-gold">
                      {event.priceNGN === 0 ? 'MEMBERS FREE' : formatPrice(event.priceNGN, 'NGN')}
                    </p>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mt-6">
                  <div className="h-px bg-od-border">
                    <div
                      data-capacity-bar
                      className="h-px bg-od-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/events" className="btn-secondary px-12 py-4">
            ALL EVENTS →
          </Link>
        </div>
      </div>
    </section>
  );
}
