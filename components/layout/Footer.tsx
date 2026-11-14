import Link from 'next/link';
import { FooterStats } from '@/components/layout/FooterStats';
import { BRAND } from '@/lib/brand';

const LINKS = {
  Platform: [
    { href: '/membership', label: 'Membership Tiers' },
    { href: '/events',     label: 'Upcoming Events'  },
    { href: '/drops',      label: 'Exclusive Drops'  },
    { href: '/access',     label: 'Apply for Access' },
  ],
  Community: [
    { href: '/community',          label: 'Leaderboard'     },
    { href: '/community#feed',     label: 'Member Feed'     },
    { href: '/community#rankings', label: 'Tier Rankings'   },
    { href: '/community#circles',  label: 'Inner Circles'   },
  ],
  Legal: [
    { href: '/privacy',         label: 'Privacy Policy' },
    { href: '/terms',           label: 'Terms of Use'   },
    { href: '/refunds',         label: 'Refund Policy' },
    { href: '/membership#faq',  label: 'FAQ'           },
    { href: '/account',         label: 'My Membership' },
  ],
};

// Set NEXT_PUBLIC_SOCIAL_* to show these; empty ones are hidden.
const SOCIALS = [
  { href: BRAND.social.x,         label: '𝕏',  title: 'X'         },
  { href: BRAND.social.instagram, label: 'IG', title: 'Instagram' },
  { href: BRAND.social.tiktok,    label: 'TT', title: 'TikTok'    },
  { href: BRAND.social.youtube,   label: '▶',  title: 'YouTube'   },
].filter(s => s.href);

const TICKER_TEXT =
  'INNER CIRCLE  ✦  ENTER THE CIRCLE  ✦  BY INVITATION ONLY  ✦  NO PHONES  ✦  NO LEAKS  ✦  EXCLUSIVE ACCESS  ✦  UNDERGROUND LUXURY  ✦  THE CIRCLE NEVER BREAKS  ◯';

export function Footer() {
  return (
    <footer className="border-t border-ic-border">
      {/* Ticker */}
      <div className="overflow-hidden border-b border-ic-border py-3 bg-ic-dark/50">
        <div
          className="ticker-content font-bebas tracking-widest text-sm text-ic-muted whitespace-nowrap"
        >
          {TICKER_TEXT}&nbsp;&nbsp;&nbsp;&nbsp;{TICKER_TEXT}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-14">

          {/* Brand block */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-ic-gold flex items-center justify-center flex-shrink-0">
                <span className="font-bebas text-ic-gold text-xl leading-none">IC</span>
              </div>
              <div>
                <p className="font-bebas text-sm tracking-[0.3em] text-ic-gold leading-tight">
                  INNER CIRCLE
                </p>
                <p className="font-mono text-[10px] tracking-[0.2em] text-ic-muted">
                  EST. BY INVITATION
                </p>
              </div>
            </div>

            <p className="text-ic-muted text-sm leading-relaxed max-w-xs mb-6">
              An elite digital society built for the real ones.
              Private events, unreleased music, and a seat in
              rooms most people never hear about.
            </p>

            <p className="font-mono text-[10px] tracking-widest text-ic-muted mb-6">
              ◯ EARNED · NOT GIVEN · NEVER SHARED
            </p>

            {/* Socials */}
            <div className="flex gap-3">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.title}
                  className="w-9 h-9 border border-ic-border flex items-center justify-center text-ic-muted hover:border-ic-gold hover:text-ic-gold transition-all duration-300 text-xs font-mono"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          <div className="md:col-span-8 grid grid-cols-3 gap-8">
            {Object.entries(LINKS).map(([section, links]) => (
              <div key={section}>
                <p className="section-label mb-5">{section}</p>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-ic-muted text-sm hover:text-white transition-colors duration-200 font-mono text-[11px] tracking-wider"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar — real numbers only */}
        <FooterStats />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[11px] tracking-widest text-ic-muted">
            © {new Date().getFullYear()} INNER CIRCLE — ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-ic-border" />
            <p className="font-mono text-[11px] tracking-widest text-ic-muted">
              THE CIRCLE NEVER BREAKS ◯
            </p>
            <div className="h-px w-8 bg-ic-border" />
          </div>
        </div>
      </div>
    </footer>
  );
}
