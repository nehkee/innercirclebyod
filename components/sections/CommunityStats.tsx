'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import type { CommunityStats as Stats, LeaderboardEntry } from '@/lib/data';
import { formatStat, countryFlag, STAT_LABELS } from '@/lib/data-format';

const TIER_COLORS: Record<string, string> = {
  industry: '#FFFFFF',
  warlord:  '#CC0000',
  insider:  '#C9A84C',
  machine:  '#9CA3AF',
};

export function CommunityStats({ stats, leaderboard }: { stats: Stats | null; leaderboard: LeaderboardEntry[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Numbers are already correct in the server HTML; only animate when motion is welcome.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      section.querySelectorAll<HTMLElement>('[data-gsap-counter]').forEach(el => {
        const target = parseInt(el.getAttribute('data-gsap-counter') || '0', 10);
        const obj    = { val: 0 };
        el.textContent = '0';
        gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate() { el.textContent = Math.round(obj.val).toLocaleString('en-US'); },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      const rows = section.querySelectorAll<HTMLElement>('[data-gsap-row]');
      if (rows.length) {
        gsap.from(rows, {
          opacity: 0, x: -20, duration: 0.5, stagger: 0.07, ease: 'power2.out',
          scrollTrigger: { trigger: rows[0], start: 'top 85%', once: true },
        });
      }
    }, section);

    return () => ctx.revert(); // only this section's triggers, not every ScrollTrigger on the page
  }, []);

  const statItems = stats
    ? (Object.keys(STAT_LABELS) as (keyof Stats)[])
        .map(k => ({ label: STAT_LABELS[k], value: stats[k] }))
        .filter(s => s.value > 0)
    : [];

  if (statItems.length === 0 && leaderboard.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-od-black border-y border-od-border"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* ── Stats ───────────────────────────────────────────────────── */}
          {statItems.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-12">
              <p className="section-label">THE NUMBERS</p>
              <div className="h-px flex-1 bg-od-border" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              {statItems.map(stat => (
                <div key={stat.label} className="border-l-2 border-od-gold pl-6">
                  <div className="font-bebas text-5xl md:text-6xl text-white leading-none mb-1">
                    <span data-gsap-counter={stat.value}>{formatStat(stat.value)}</span>
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-od-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* ── Leaderboard ─────────────────────────────────────────────── */}
          {leaderboard.length > 0 && (
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
              {leaderboard.map(member => (
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
                      {countryFlag(member.country)} {member.username}
                    </p>
                    <p
                      className="font-mono text-[9px] tracking-widest"
                      style={{ color: TIER_COLORS[member.tier] }}
                    >
                      {member.tier.toUpperCase()}
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
          )}
        </div>
      </div>
    </section>
  );
}
