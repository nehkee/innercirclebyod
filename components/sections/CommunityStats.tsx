'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: 12400, suffix: '+', label: 'MEMBERS'   },
  { value: 48,    suffix: '',  label: 'EVENTS'    },
  { value: 14,    suffix: '',  label: 'CITIES'    },
  { value: 9,     suffix: '',  label: 'COUNTRIES' },
  { value: 97,    suffix: '%', label: 'RENEWAL'   },
];

const TOP_MEMBERS = [
  { rank: 1,  name: 'WARLORD_ABUJA',   tier: 'INDUSTRY', points: 24500, country: '🇳🇬' },
  { rank: 2,  name: 'MACHINE_ADEOLU',  tier: 'WARLORD',  points: 19200, country: '🇳🇬' },
  { rank: 3,  name: 'INSIDER_LONDON',  tier: 'WARLORD',  points: 17800, country: '🇬🇧' },
  { rank: 4,  name: 'OD_STEPH',        tier: 'INSIDER',  points: 15400, country: '🇺🇸' },
  { rank: 5,  name: 'CIRCUIT_KEMI',    tier: 'INSIDER',  points: 14100, country: '🇳🇬' },
];

const TIER_COLORS: Record<string, string> = {
  INDUSTRY: '#FFFFFF',
  WARLORD:  '#CC0000',
  INSIDER:  '#C9A84C',
  MACHINE:  '#9CA3AF',
};

export function CommunityStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // GSAP ScrollTrigger counter animation for each stat number
    const numbers = section.querySelectorAll<HTMLElement>('[data-gsap-counter]');

    numbers.forEach(el => {
      const target  = parseInt(el.getAttribute('data-gsap-counter') || '0', 10);
      const obj     = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2.2,
        ease: 'power3.out',
        onUpdate() {
          el.textContent = Math.round(obj.val).toLocaleString();
        },
        scrollTrigger: {
          trigger: el,
          start:   'top 85%',
          once:    true,
        },
      });
    });

    // Stagger entrance for leaderboard rows
    const rows = section.querySelectorAll<HTMLElement>('[data-gsap-row]');
    gsap.from(rows, {
      opacity: 0,
      x: -20,
      duration: 0.5,
      stagger: 0.07,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: rows[0],
        start:   'top 85%',
        once:    true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-od-black border-y border-od-border"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* ── Stats ───────────────────────────────────────────────────── */}
          <div ref={statsRef}>
            <div className="flex items-center gap-4 mb-12">
              <p className="section-label">THE NUMBERS</p>
              <div className="h-px flex-1 bg-od-border" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              {STATS.map(stat => (
                <div key={stat.label} className="border-l-2 border-od-gold pl-6">
                  <div className="font-bebas text-5xl md:text-6xl text-white leading-none mb-1">
                    <span data-gsap-counter={stat.value}>0</span>
                    {stat.suffix}
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-od-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Leaderboard ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <p className="section-label">LEADERBOARD</p>
              <div className="h-px flex-1 bg-od-border" />
              <Link
                href="/community"
                className="font-mono text-[10px] tracking-widest text-od-muted hover:text-od-gold transition-colors"
              >
                FULL →
              </Link>
            </div>

            <div className="space-y-4">
              {TOP_MEMBERS.map(member => (
                <div
                  key={member.rank}
                  data-gsap-row
                  className="flex items-center gap-4 py-3 border-b border-od-border/50 group"
                >
                  <span className="font-mono text-2xl font-bold text-od-border group-hover:text-od-muted transition-colors w-8">
                    {member.rank}
                  </span>

                  <div className="flex-1">
                    <p className="font-mono text-sm tracking-wider text-white">
                      {member.country} {member.name}
                    </p>
                    <p
                      className="font-mono text-[9px] tracking-widest"
                      style={{ color: TIER_COLORS[member.tier] }}
                    >
                      {member.tier}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bebas text-lg text-od-gold">
                      {member.points.toLocaleString()}
                    </p>
                    <p className="font-mono text-[9px] text-od-muted tracking-widest">PTS</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/community" className="btn-secondary w-full text-center py-3 text-sm">
                JOIN THE LEADERBOARD →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
