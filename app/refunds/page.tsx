import Link from 'next/link';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { RETENTION } from '@/lib/support/config';

export const metadata = {
  title:       'Refund Policy | Inner Circle',
  description: `How cancellations and refunds work at Inner Circle. Approved refunds are processed within ${RETENTION.refundDays} days.`,
};

const STEPS = [
  {
    title: 'Talk to us first',
    body:  'Open the concierge chat from your account ("Change or cancel" or "Can\'t make it?"). A real member of the team is behind it.',
  },
  {
    title: "We'll try to make it right",
    body:  `Can't make the date? We can move your ticket to another event or let you give it to a friend. For memberships we can pause, discount (${RETENTION.membershipDiscountPercent}% off) or upgrade you at the same price.`,
  },
  {
    title: 'Still want a refund? You get one',
    body:  `If none of that works for you, request a refund in the chat. The team processes approved refunds within ${RETENTION.refundDays} days, back to the original payment method.`,
  },
];

export default function RefundsPage() {
  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="section-label mb-4">THE FINE PRINT, PLAINLY</p>
          <h1 className="font-bebas gold-text leading-none mb-8" style={{ fontSize: 'clamp(56px, 12vw, 130px)' }}>REFUNDS</h1>
          <p className="text-ic-silver text-lg leading-relaxed mb-14">
            The circle is built on trust. If something isn&apos;t working, we&apos;d rather fix it than lose you, and if we can&apos;t, we&apos;ll give your money back.
          </p>

          <ol className="space-y-8 mb-16">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-6">
                <span className="font-mono text-3xl font-bold text-ic-border">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="font-bebas text-2xl text-white mb-1">{s.title.toUpperCase()}</p>
                  <p className="text-ic-muted leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="border border-ic-border p-6 space-y-3 text-sm text-ic-muted leading-relaxed mb-12">
            <p><span className="text-white">Card memberships</span> can be cancelled any time from your account. You keep access until the end of the period you&apos;ve paid for.</p>
            <p><span className="text-white">Paystack and crypto memberships</span> are 30-day passes. They don&apos;t renew, so there&apos;s nothing to cancel.</p>
            <p><span className="text-white">Crypto refunds</span> are sent to a wallet address you give us in the chat, in the coin you paid with.</p>
            <p><span className="text-white">Events that have already happened</span> aren&apos;t refundable. Talk to the team if something went wrong on the night.</p>
          </div>

          <Link href="/account" className="btn-primary px-10 py-3 text-sm">GO TO MY ACCOUNT</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
