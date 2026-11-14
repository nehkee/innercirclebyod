'use client';

import { useEffect, useRef, Suspense, lazy } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import type { Event } from '@/types';
import type { CommunityStats } from '@/lib/data';
import { formatStat } from '@/lib/data-format';

// Lazy-load Three.js to avoid SSR issues and keep initial bundle small
const ParticleBackground = lazy(() =>
  import('@/components/ui/ParticleBackground').then(m => ({ default: m.ParticleBackground }))
);

const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero({ nextEvent, stats }: { nextEvent: Event | null; stats: CommunityStats | null }) {
  const heroRef     = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const parallaxY   = useTransform(scrollY, [0, 700], [0, -140]);
  const fadeOut     = useTransform(scrollY, [0, 450], [1, 0]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--mx', `${(e.clientX / window.innerWidth  - 0.5) * 30}px`);
      el.style.setProperty('--my', `${(e.clientY / window.innerHeight - 0.5) * 30}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-24"
      style={{ background: '#080808' }}
    >
      {/* ── Three.js Particle Field ───────────────────────────────────────── */}
      <Suspense fallback={null}>
        <ParticleBackground
          count={800}
          color={0xC9A84C}
          size={0.018}
          opacity={0.4}
          speed={0.8}
        />
      </Suspense>

      {/* ── Grid overlay ─────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Radial vignette ──────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, #080808 90%)',
        }}
      />

      {/* ── Ambient glow spots ───────────────────────────────────────────── */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-ic-gold blur-[160px] pointer-events-none z-[1]"
        style={{ opacity: 0.05, y: parallaxY }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-ic-red blur-[130px] pointer-events-none z-[1]"
        style={{ opacity: 0.035, y: parallaxY }}
      />

      {/* ── Scanline sweep ───────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 h-px bg-ic-gold/15 pointer-events-none z-[3]"
        style={{ animation: 'scanline 9s linear infinite' }}
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-7xl mx-auto"
        style={{ opacity: fadeOut }}
      >
        {/* Label */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
        >
          <div className="h-px w-12 bg-ic-gold/40" />
          <p className="font-mono text-[11px] tracking-[0.4em] text-ic-gold uppercase">
            An Elite Digital Society
          </p>
          <div className="h-px w-12 bg-ic-gold/40" />
        </motion.div>

        {/* INNER */}
        <div className="overflow-hidden">
          <motion.h1
            className="glitch font-bebas leading-none tracking-tight select-none"
            data-text="INNER"
            style={{ fontSize: 'clamp(72px, min(18vw, 21vh), 260px)' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            INNER
          </motion.h1>
        </div>

        {/* CIRCLE */}
        <div className="overflow-hidden -mt-4 md:-mt-8">
          <motion.h1
            className="glitch font-bebas leading-none tracking-tight select-none gold-text"
            data-text="CIRCLE"
            style={{ fontSize: 'clamp(72px, min(18vw, 21vh), 260px)' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.28, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            CIRCLE
          </motion.h1>
        </div>

        {/* Motto */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-4 mb-10"
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
        >
          <div className="h-px flex-1 max-w-[80px] bg-ic-border" />
          <p className="font-bebas tracking-[0.5em] text-ic-muted text-xl md:text-2xl">BY INVITATION</p>
          <div className="h-px flex-1 max-w-[80px] bg-ic-border" />
        </motion.div>

        {/* Countdown */}
        <motion.div
          className="mb-10"
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
        >
          <p className="section-label mb-4">NEXT DROP</p>
          {nextEvent ? (
            <>
              <div className="flex justify-center">
                <CountdownTimer targetDate={nextEvent.date} />
              </div>
              <Link
                href={`/events/${nextEvent.id}`}
                className="inline-block font-mono text-[11px] tracking-widest text-ic-muted hover:text-ic-gold transition-colors mt-3"
              >
                {nextEvent.title} — {nextEvent.location.split(',')[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <p className="font-bebas text-3xl tracking-widest text-ic-gold">ANNOUNCED SOON</p>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={fadeUp} initial="hidden" animate="visible" custom={5}
        >
          <Link href="/join" className="btn-primary text-base px-12 py-4">
            ENTER THE CIRCLE ◯
          </Link>
          <Link href="/events" className="btn-secondary text-base px-12 py-4">
            SEE EVENTS
          </Link>
        </motion.div>

        {/* Social proof — real numbers only */}
        {stats && (
          <motion.p
            className="font-mono text-[11px] tracking-widest text-ic-muted mt-12"
            variants={fadeUp} initial="hidden" animate="visible" custom={6}
          >
            {[
              `${formatStat(stats.members)} MEMBERS`,
              stats.countries > 0 && `${stats.countries} ${stats.countries === 1 ? 'COUNTRY' : 'COUNTRIES'}`,
              stats.events > 0 && `${stats.events} ${stats.events === 1 ? 'EVENT' : 'EVENTS'}`,
            ].filter(Boolean).join('  ·  ')}
          </motion.p>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        style={{ opacity: fadeOut }}
      >
        <p className="font-mono text-[10px] tracking-[0.3em] text-ic-muted">SCROLL</p>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-ic-muted to-transparent"
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{ originY: 0 }}
        />
      </motion.div>
    </section>
  );
}
