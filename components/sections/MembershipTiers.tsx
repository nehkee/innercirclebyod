'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { TIERS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

export function MembershipTiers({ compact = false }: { compact?: boolean }) {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">MEMBERSHIP</p>
          <div className="h-px flex-1 bg-ic-border" />
        </motion.div>

        <div className="overflow-hidden mb-16">
          <motion.h2
            className="font-bebas gold-text"
            style={{ fontSize: 'clamp(48px, 10vw, 120px)' }}
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            CHOOSE YOUR STATUS
          </motion.h2>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              className={`
                relative border p-8 flex flex-col
                card-glow transition-all duration-500
                ${tier.featured ? 'border-ic-gold bg-ic-gray/50' : 'border-ic-border bg-ic-dark/50'}
              `}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {tier.featured && (
                <div
                  className="absolute -top-px left-6 right-6 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }}
                />
              )}

              <div className="mb-8">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-mono tracking-widest mb-4"
                  style={{
                    borderColor: `rgba(${tier.colorRgb}, 0.3)`,
                    color: tier.color,
                    background: `rgba(${tier.colorRgb}, 0.05)`,
                  }}
                >
                  ◯ {tier.name}
                </div>

                <h3
                  className="font-bebas leading-none mb-2"
                  style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: tier.color }}
                >
                  {tier.name}
                </h3>
                <p className="font-mono text-xs tracking-wider text-ic-muted">{tier.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-ic-border">
                <div className="flex items-baseline gap-2">
                  <span className="font-bebas text-4xl" style={{ color: tier.color }}>
                    ${tier.priceUSD}
                  </span>
                  <span className="font-mono text-xs text-ic-muted">/mo</span>
                </div>
                <p className="font-mono text-xs text-ic-muted mt-1">
                  {formatPrice(tier.priceNGN, 'NGN')}/mo
                </p>
              </div>

              {/* Benefits */}
              {!compact && (
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.benefits.map((b, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                      <span className="text-ic-silver text-sm">{b}</span>
                    </li>
                  ))}
                  {tier.exclusive.map((e, j) => (
                    <li key={`ex-${j}`} className="flex items-start gap-3">
                      <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: tier.color }}>★</span>
                      <span className="text-sm font-medium" style={{ color: tier.color }}>{e}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              <Link
                href={`/membership?tier=${tier.id}`}
                className="block text-center py-3 px-6 border font-bebas tracking-widest text-sm transition-all duration-300"
                style={{ borderColor: tier.color, color: tier.color }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = tier.color;
                  el.style.color = '#000';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.color = tier.color;
                }}
              >
                JOIN {tier.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
