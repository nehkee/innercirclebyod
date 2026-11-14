import Link from 'next/link';
import { FooterStats } from '@/components/layout/FooterStats';

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
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms',   label: 'Terms of Use'   },
    { href: '/refunds', label: 'Refund Policy'  },
    { href: '/faq',     label: 'FAQ'            },
  ],
};

const SOCIALS = [
  { href: 'https://twitter.com/Odumodublvck_', label: '𝕏',    title: 'Twitter / X'  },
  { href: 'https://instagram.com',              label: 'IG',   title: 'Instagram'    },
  { href: 'https://spotify.com',                label: '♫',    title: 'Spotify'      },
  { href: 'https://tiktok.com',                 label: 'TT',   title: 'TikTok'       },
];

const TICKER_TEXT =
  'INNER CIRCLE BY OD  ✦  INDUSTRY MACHINE ⚙️  ✦  ENTER THE MACHINE  ✦  WARLORD SEASON  ✦  NATIVE RECORDS  ✦  EXCLUSIVE ACCESS  ✦  UNDERGROUND LUXURY  ✦  NIGERIAN INTERNET CULTURE  ✦  THE CIRCLE NEVER BREAKS  ✦  ODUMODUBLVCK  ✦';

export function Footer() {
  return (
    <footer className="border-t border-od-border">
      {/* Ticker */}
      <div className="overflow-hidden border-b border-od-border py-3 bg-od-dark/50">
        <div
          className="ticker-content font-bebas tracking-widest text-sm text-od-muted whitespace-nowrap"
        >
          {TICKER_TEXT}&nbsp;&nbsp;&nbsp;&nbsp;{TICKER_TEXT}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-14">

          {/* Brand block */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-od-gold flex items-center justify-center flex-shrink-0">
                <span className="font-bebas text-od-gold text-xl leading-none">OD</span>
              </div>
              <div>
                <p className="font-bebas text-sm tracking-[0.3em] text-od-gold leading-tight">
                  INNER CIRCLE
                </p>
                <p className="font-mono text-[9px] tracking-[0.2em] text-od-muted">
                  BY ODUMODUBLVCK
                </p>
              </div>
            </div>

            <p className="text-od-muted text-sm leading-relaxed max-w-xs mb-6">
              An elite digital society built for the real ones.
              Exclusive access to private events, unreleased music,
              and direct connection to the machine.
            </p>

            <p className="font-mono text-[9px] tracking-widest text-od-muted mb-6">
              INDUSTRY MACHINE ⚙️ · ARTIST · REVOLUTIONARY · MACHINE
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
                  className="w-9 h-9 border border-od-border flex items-center justify-center text-od-muted hover:border-od-gold hover:text-od-gold transition-all duration-300 text-xs font-mono"
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
                        className="text-od-muted text-sm hover:text-white transition-colors duration-200 font-mono text-[11px] tracking-wider"
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
          <p className="font-mono text-[10px] tracking-widest text-od-muted">
            © {new Date().getFullYear()} INNERCIRCLEBYOD.COM — ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-od-border" />
            <p className="font-mono text-[10px] tracking-widest text-od-muted">
              NATIVE RECORDS · INDUSTRY MACHINE ⚙️
            </p>
            <div className="h-px w-8 bg-od-border" />
          </div>
        </div>
      </div>
    </footer>
  );
}
