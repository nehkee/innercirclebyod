'use client';

import { useState } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { TIERS } from '@/lib/constants';
import { CheckoutModal } from '@/components/checkout/CheckoutModal';
import type { PaymentMethods } from '@/lib/payments/config';
import type { TierConfig } from '@/types';
import { Check, Zap } from 'lucide-react';

type Currency = 'USD' | 'NGN';

const FAQ = [
  { q: 'What payment methods do you accept?', a: 'Cards worldwide (Visa, Mastercard, Amex) in USD, Paystack in naira (card, bank transfer, USSD), and crypto: USDT and USDC on Tron, Ethereum and Solana, plus Bitcoin.' },
  { q: 'Does my membership renew automatically?', a: 'Card memberships renew monthly until you cancel. Paystack and crypto payments buy 30 days of access; buy again to renew and the time stacks.' },
  { q: 'Can I cancel anytime?',              a: 'Yes. Contact us to cancel a card membership before your next billing date. Paystack and crypto passes simply expire.' },
  { q: 'Can I upgrade my tier later?',       a: 'Yes. Buy the higher tier and your new access starts immediately.' },
  { q: 'Are there annual plans?',            a: 'Annual plans with a 20% discount are coming soon.' },
  { q: 'Is my data secure?',                a: 'Yes. We use Clerk for auth and never store card data directly.' },
];

export function MembershipView({ methods }: { methods: PaymentMethods }) {
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [selected, setSelected] = useState<TierConfig | null>(null);

  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-20 text-center px-6">
        <p className="section-label mb-4">JOIN THE INNER CIRCLE</p>
        <h1
          className="font-bebas gold-text leading-none mb-6"
          style={{ fontSize: 'clamp(60px, 14vw, 160px)' }}
        >
          YOUR MEMBERSHIP
        </h1>
        <p className="text-od-silver max-w-xl mx-auto mb-8">
          Choose your status. Lock in your access. Enter the machine.
        </p>

        {/* Currency Toggle */}
        <div className="inline-flex border border-od-border">
          {(['USD', 'NGN'] as Currency[]).map(cur => (
            <button
              key={cur}
              onClick={() => setCurrency(cur)}
              className={`px-6 py-2 font-mono text-sm tracking-widest transition-all ${
                currency === cur
                  ? 'bg-od-gold text-black'
                  : 'text-od-muted hover:text-white'
              }`}
            >
              {cur === 'USD' ? '$ USD' : '₦ NGN'}
            </button>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TIERS.map(tier => (
            <div
              key={tier.id}
              className={`
                relative border p-8 flex flex-col transition-all duration-500
                ${tier.featured
                  ? 'border-od-gold bg-od-gray/50'
                  : 'border-od-border bg-od-dark/50'}
              `}
            >
              {tier.featured && (
                <>
                  <div
                    className="absolute -top-px left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <span className="bg-od-gold text-black font-mono text-[10px] tracking-widest px-3 py-1">
                      MOST POPULAR
                    </span>
                  </div>
                </>
              )}

              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-mono tracking-widest mb-6 w-fit"
                style={{ borderColor: `rgba(${tier.colorRgb}, 0.4)`, color: tier.color, background: `rgba(${tier.colorRgb}, 0.07)` }}
              >
                <Zap size={10} /> {tier.id.toUpperCase()}
              </div>

              {/* Name */}
              <h2
                className="font-bebas leading-none mb-2"
                style={{ fontSize: '52px', color: tier.color }}
              >
                {tier.name}
              </h2>
              <p className="font-mono text-xs tracking-wider text-od-muted mb-8">{tier.tagline}</p>

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-od-border">
                <div className="flex items-baseline gap-1">
                  <span className="font-bebas text-5xl" style={{ color: tier.color }}>
                    {currency === 'USD'
                      ? `$${tier.priceUSD}`
                      : `₦${tier.priceNGN.toLocaleString()}`}
                  </span>
                  <span className="font-mono text-xs text-od-muted">/mo</span>
                </div>
                <p className="font-mono text-[10px] text-od-muted mt-1">
                  Card renews monthly · Paystack & crypto: 30 days
                </p>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-8 flex-1">
                {tier.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                    <span className="text-od-silver text-sm">{b}</span>
                  </li>
                ))}
                {tier.exclusive.map((e, i) => (
                  <li key={`ex-${i}`} className="flex items-start gap-3">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: tier.color }}>★</span>
                    <span className="text-sm font-medium" style={{ color: tier.color }}>{e}</span>
                  </li>
                ))}
              </ul>

              {/* CTA — opens payment options (sign-in is requested if needed) */}
              <button
                type="button"
                onClick={() => setSelected(tier)}
                className="w-full border p-4 font-bebas tracking-widest text-lg transition-colors hover:bg-white/5"
                style={{ borderColor: tier.color, color: tier.color }}
              >
                JOIN {tier.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 border-t border-od-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="section-label mb-6 text-center">FULL COMPARISON</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-od-border">
                  <th className="text-left py-4 pr-8 font-mono text-xs text-od-muted tracking-widest">FEATURE</th>
                  {TIERS.map(t => (
                    <th key={t.id} className="py-4 px-4 font-bebas text-base" style={{ color: t.color }}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Member Feed',            true,  true,  true,  true ],
                  ['Event Announcements',    true,  true,  true,  true ],
                  ['Priority Tickets (48h)', false, true,  true,  true ],
                  ['Exclusive Discord',      false, true,  true,  true ],
                  ['Quarterly Meetups',      false, false, true,  true ],
                  ['Studio Raffles',         false, false, true,  true ],
                  ['Signed Merch Access',    false, false, true,  true ],
                  ['Industry Networking',    false, false, false, true ],
                  ['Private Show Invite',    false, false, false, true ],
                  ['OD Team Direct Line',    false, false, false, true ],
                ].map(([feature, ...vals]) => (
                  <tr key={String(feature)} className="border-b border-od-border/30">
                    <td className="py-3 pr-8 text-od-silver">{feature}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="py-3 px-4 text-center">
                        {v
                          ? <Check size={14} className="mx-auto" style={{ color: TIERS[i].color }} />
                          : <span className="text-od-border">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="section-label mb-6 text-center">QUESTIONS</p>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-od-border p-6">
                <p className="font-bebas text-lg text-od-gold mb-2">{item.q}</p>
                <p className="text-od-muted text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CheckoutModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} MEMBERSHIP` : ''}
        subtitle={selected?.tagline.toUpperCase() ?? ''}
        color={selected?.color}
        product={{ kind: 'membership', tier: selected?.id ?? 'machine' }}
        methods={methods}
        priceUSD={selected?.priceUSD ?? 0}
        priceNGN={selected?.priceNGN ?? 0}
      />

      <Footer />
    </main>
  );
}
