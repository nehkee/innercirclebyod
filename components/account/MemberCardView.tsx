import { Download } from 'lucide-react';
import { TIERS } from '@/lib/constants';
import { ringsFor } from '@/lib/art';

interface Card { username: string; tier: string | null; since: string; number: string; qr: string }

/** The digital membership card: tier colours, generated rings, and a QR venues can scan to verify. */
export function MemberCardView({ card }: { card: Card }) {
  const tier   = TIERS.find(t => t.id === card.tier);
  const accent = tier?.color ?? '#C9A84C';
  const light  = tier?.id === 'sovereign';
  const rings  = ringsFor(card.number, 7);
  const ink    = light ? '#080808' : accent;

  return (
    <section className="lg:col-span-3">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div
          className="relative w-full max-w-md aspect-[1.586] overflow-hidden shadow-2xl shadow-black/60 border"
          style={{ background: light ? '#F5F5F5' : '#0B0B0B', borderColor: `${accent}66` }}
        >
          <svg viewBox="0 0 400 500" preserveAspectRatio="xMaxYMin slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            {rings.map((r, i) => (
              <circle key={i} cx={r.cx + 160} cy={r.cy - 60} r={r.r} fill="none" stroke={ink} strokeWidth={r.width}
                strokeDasharray={r.dash || undefined} opacity={r.opacity * 0.7} />
            ))}
          </svg>
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 border flex items-center justify-center font-bebas text-sm" style={{ borderColor: light ? '#080808' : '#C9A84C', color: light ? '#080808' : '#C9A84C' }}>IC</span>
                <span className="font-bebas tracking-[0.3em] text-sm" style={{ color: light ? '#080808' : '#C9A84C' }}>INNER CIRCLE</span>
              </div>
              <span className="font-mono text-[10px] tracking-widest" style={{ color: light ? '#555' : '#8C8C8C' }}>{card.number}</span>
            </div>
            <div className="flex justify-between items-end gap-3">
              <div className="min-w-0">
                <p className="font-bebas leading-[0.85] text-5xl sm:text-6xl" style={{ color: ink }}>{tier?.name ?? 'MEMBER'}</p>
                <p className="font-mono text-sm tracking-widest truncate mt-2" style={{ color: light ? '#080808' : '#FFFFFF' }}>{card.username}</p>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: light ? '#555' : '#8C8C8C' }}>SINCE {card.since}</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.qr} alt="Membership verification QR code" className="w-20 h-20 sm:w-24 sm:h-24 border-4 flex-shrink-0" style={{ borderColor: light ? '#080808' : '#FFFFFF' }} />
            </div>
          </div>
        </div>

        <div className="max-w-sm">
          <p className="section-label mb-2">YOUR CARD</p>
          <p className="text-ic-muted text-sm leading-relaxed mb-4">
            Show it at partner venues and member events. Staff scan the code to confirm you&apos;re in the circle. It only ever shows your handle and tier.
          </p>
          <a href="/api/account/card" download="inner-circle-card.png"
            className="inline-flex items-center gap-2 border border-ic-gold text-ic-gold hover:bg-ic-gold/10 px-5 py-2.5 font-mono text-[11px] tracking-widest">
            <Download size={14} /> SAVE CARD TO PHONE
          </a>
          <p className="font-mono text-[10px] tracking-widest text-ic-muted mt-3">APPLE & GOOGLE WALLET PASSES: COMING SOON</p>
        </div>
      </div>
    </section>
  );
}
