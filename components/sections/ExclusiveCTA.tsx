'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import type { CommunityStats } from '@/lib/data';
import { formatStat } from '@/lib/data-format';
import { CircleField } from '@/components/art/CircleField';

const RULES = [
  'No leaks. No screenshots. No excuses.',
  'What happens in the circle stays in the circle.',
  'The circle protects those who protect the circle.',
  'Loyalty is the only currency that matters here.',
];

export function ExclusiveCTA({ stats }: { stats: CommunityStats | null }) {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#080808' }}
    >
      <CircleField className="absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vmin] h-[160vmin] opacity-70" />

      {/* Gold radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Red accent glow */}
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(204,0,0,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Gold grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Scanline */}
      <div
        className="absolute left-0 right-0 h-px bg-ic-gold/10 pointer-events-none"
        style={{ animation: 'scanline 12s linear infinite' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">

        {/* Pre-label */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="h-px w-16 bg-ic-gold/40" />
          <p className="font-mono text-[11px] tracking-[0.5em] text-ic-gold">THE INVITATION</p>
          <div className="h-px w-16 bg-ic-gold/40" />
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden mb-2">
          <motion.h2
            className="glitch font-bebas leading-none gold-text select-none"
            data-text="ARE YOU"
            style={{ fontSize: 'clamp(70px, 16vw, 220px)' }}
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            ARE YOU
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            className="glitch font-bebas leading-none text-white select-none"
            data-text="IN?"
            style={{ fontSize: 'clamp(70px, 16vw, 220px)' }}
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            IN?
          </motion.h2>
        </div>

        {/* Rules */}
        <motion.div
          className="mt-12 mb-12 space-y-3"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {RULES.map((rule, i) => (
            <motion.p
              key={i}
              className="font-mono text-[11px] tracking-widest text-ic-muted"
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
            >
              <span className="text-ic-gold mr-3">—</span>{rule}
            </motion.p>
          ))}
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="text-ic-silver text-base md:text-lg max-w-lg mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          Not everyone gets in. Not everyone deserves to.
          But if you made it this far — the circle already knows who you are.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          <Link
            href="/join"
            className="btn-primary text-base px-16 py-5 text-lg"
          >
            ENTER THE CIRCLE ◯
          </Link>
          <Link
            href="/access"
            className="btn-secondary text-base px-16 py-5 text-lg"
          >
            APPLY FOR ACCESS
          </Link>
        </motion.div>

        {/* Member count */}
        <motion.p
          className="font-mono text-[11px] tracking-widest text-ic-muted mt-14"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          {[
            stats && `${formatStat(stats.members)} MEMBERS`,
            stats && stats.countries > 0 && `${stats.countries} ${stats.countries === 1 ? 'COUNTRY' : 'COUNTRIES'}`,
            stats && stats.events > 0 && `${stats.events} ${stats.events === 1 ? 'EVENT' : 'EVENTS'}`,
            'THE CIRCLE IS CLOSED',
          ].filter(Boolean).join('  ·  ')}
        </motion.p>
      </div>
    </section>
  );
}
