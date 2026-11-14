'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { TIERS } from '@/lib/constants';
import type { TierConfig } from '@/types';
import { formatPrice } from '@/lib/utils';

function TierCard({ tier, index }: { tier: TierConfig; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const rgb = tier.colorRgb;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 + 0.15 }}
      className="group relative border border-ic-border cursor-pointer transition-all duration-500"
      style={{
        background: tier.featured
          ? `linear-gradient(135deg, rgba(${rgb},0.08) 0%, transparent 60%)`
          : 'transparent',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = tier.color;
        (e.currentTarget as HTMLDivElement).style.background =
          `linear-gradient(135deg, rgba(${rgb},0.1) 0%, transparent 60%)`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '';
        (e.currentTarget as HTMLDivElement).style.background = tier.featured
          ? `linear-gradient(135deg, rgba(${rgb},0.08) 0%, transparent 60%)`
          : '';
      }}
    >
      {/* Featured badge */}
      {tier.featured && (
        <div
          className="absolute -top-px left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }}
        />
      )}

      <div className="p-8">
        {/* Number + tier name */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span
              className="font-mono text-[10px] tracking-[0.4em] mb-2 block"
              style={{ color: tier.color }}
            >
              TIER {String(index + 1).padStart(2, '0')}
            </span>
            <h3
              className="font-bebas text-4xl md:text-5xl leading-none transition-colors duration-300 group-hover:text-white"
              style={{ color: tier.featured ? tier.color : '#9CA3AF' }}
            >
              {tier.name}
            </h3>
            <p className="text-ic-muted text-sm mt-2 italic">{tier.tagline}</p>
          </div>
          {tier.featured && (
            <span
              className="font-mono text-[10px] tracking-widest border px-2 py-1"
              style={{ color: tier.color, borderColor: tier.color }}
            >
              POPULAR
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-6 pb-6 border-b border-ic-border">
          <p className="font-bebas text-3xl text-white">
            {formatPrice(tier.priceNGN, 'NGN')}
            <span className="font-mono text-xs text-ic-muted ml-2">/MONTH</span>
          </p>
          <p className="font-mono text-[11px] text-ic-muted mt-1">
            ${tier.priceUSD} USD / MONTH
          </p>
        </div>

        {/* Top benefits (always visible) */}
        <ul className="space-y-2.5 mb-6">
          {tier.benefits.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ic-silver">
              <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
              {b}
            </li>
          ))}
        </ul>

        {/* Expand toggle */}
        {tier.benefits.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-ic-muted hover:text-ic-gold transition-colors mb-4"
          >
            <ChevronDown
              size={12}
              className="transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
            {expanded ? 'LESS' : `+${tier.benefits.length - 3} MORE`}
          </button>
        )}

        {/* Expanded benefits */}
        {expanded && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2.5 mb-6"
          >
            {tier.benefits.slice(3).map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ic-silver">
                <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                {b}
              </li>
            ))}
          </motion.ul>
        )}

        {/* Exclusive perks */}
        {tier.exclusive && tier.exclusive.length > 0 && (
          <div
            className="p-3 mb-6 border-l-2"
            style={{
              borderColor: tier.color,
              background:  `rgba(${rgb},0.05)`,
            }}
          >
            {tier.exclusive.map((ex, i) => (
              <p key={i} className="font-mono text-[11px] tracking-wider text-ic-muted">
                ✦ {ex}
              </p>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href="/membership"
          className="block w-full text-center font-mono text-xs tracking-widest py-3.5 border transition-all duration-300"
          style={{
            color:       tier.featured ? '#080808' : tier.color,
            borderColor: tier.color,
            background:  tier.featured ? tier.color : 'transparent',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = tier.color;
            el.style.color      = '#080808';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = tier.featured ? tier.color : 'transparent';
            el.style.color      = tier.featured ? '#080808' : tier.color;
          }}
        >
          JOIN {tier.name} →
        </Link>
      </div>
    </motion.div>
  );
}

export function MembershipShowcase() {
  const headerRef    = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' });

  return (
    <section className="py-24 bg-ic-black">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div ref={headerRef}>
          <motion.div
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, x: -30 }}
            animate={headerInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <p className="section-label">MEMBERSHIP</p>
            <div className="h-px flex-1 bg-ic-border" />
            <Link
              href="/membership"
              className="font-mono text-[11px] tracking-widest text-ic-muted hover:text-ic-gold transition-colors"
            >
              COMPARE TIERS →
            </Link>
          </motion.div>

          <div className="overflow-hidden mb-16">
            <motion.h2
              className="font-bebas text-white leading-none"
              style={{ fontSize: 'clamp(48px, 10vw, 130px)' }}
              initial={{ y: '110%' }}
              animate={headerInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              CHOOSE YOUR TIER
            </motion.h2>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} index={i} />
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-10 text-center">
          <p className="font-mono text-[11px] tracking-widest text-ic-muted">
            BILLED MONTHLY  ·  CANCEL ANYTIME  ·  NGN & USD ACCEPTED
          </p>
        </div>
      </div>
    </section>
  );
}
