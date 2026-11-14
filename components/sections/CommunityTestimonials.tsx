'use client';

interface Quote {
  text:    string;
  handle:  string;
  tier:    string;
  country: string;
}

const ROW_ONE: Quote[] = [
  { text: 'This is the only fan community that actually feels elite. Not a simulation.',          handle: '@CIRCLE_ABUJA',    tier: 'SOVEREIGN',  country: '🇳🇬' },
  { text: 'Got the pre-sale 48 hours before anyone else. The system works.',                     handle: '@SIGNAL_ADEOLU',   tier: 'VANGUARD',   country: '🇳🇬' },
  { text: 'Flew from London for the listening party. Worth every naira.',                         handle: '@INSIDER_LONDON',   tier: 'VANGUARD',   country: '🇬🇧' },
  { text: 'The leaderboard has me competitive in ways no other platform does.',                  handle: '@STEPH_NYC',         tier: 'INSIDER',   country: '🇺🇸' },
  { text: 'Inner Circle is the only place where being a real fan means something.',              handle: '@CIRCUIT_KEMI',     tier: 'INSIDER',   country: '🇳🇬' },
  { text: 'Secret event last month was a spiritual experience. True underground.',               handle: '@CULT_EMEKA',       tier: 'VANGUARD',   country: '🇳🇬' },
];

const ROW_TWO: Quote[] = [
  { text: 'No cap — this is the most dialed-in fan experience in African music right now.',      handle: '@FIRSTLISTEN_FELIX',    tier: 'INITIATE',   country: '🇬🇭' },
  { text: 'The unreleased previews alone are worth the VANGUARD tier.',                           handle: '@INNER_TIFE',       tier: 'VANGUARD',   country: '🇳🇬' },
  { text: 'Got raffle picked for a studio session. Life has not been the same.',                  handle: '@ABUJA_CONNECT',    tier: 'INSIDER',   country: '🇳🇬' },
  { text: 'The industry network access opened two doors I\'ve been pushing on for two years.',   handle: '@VAULT_OLUWATOBI', tier: 'SOVEREIGN', country: '🇳🇬' },
  { text: 'Every drop sells out to members first. The circle protects its own.',                handle: '@CIRCUIT_DAVE',     tier: 'INSIDER',   country: '🇨🇦' },
  { text: 'Worth it for the Discord alone. The conversations here are at another level.',        handle: '@LEGEND_CHIKA',     tier: 'INITIATE',   country: '🇳🇬' },
];

const TIER_COLORS: Record<string, string> = {
  SOVEREIGN: '#FFFFFF',
  VANGUARD: '#CC0000',
  INSIDER:  '#C9A84C',
  INITIATE: '#9CA3AF',
};

function QuoteCard({ q }: { q: Quote }) {
  return (
    <div className="inline-flex flex-col gap-3 border border-ic-border bg-ic-gray/20 p-6 mx-3 w-[340px] flex-shrink-0">
      <p className="text-ic-silver text-sm leading-relaxed">&ldquo;{q.text}&rdquo;</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-wider text-white">
            {q.country} {q.handle}
          </p>
          <p
            className="font-mono text-[9px] tracking-widest"
            style={{ color: TIER_COLORS[q.tier] }}
          >
            {q.tier}
          </p>
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: TIER_COLORS[q.tier] }}
        />
      </div>
    </div>
  );
}

function MarqueeRow({ quotes, reverse }: { quotes: Quote[]; reverse?: boolean }) {
  const doubled = [...quotes, ...quotes];
  const anim    = reverse ? 'ticker-rev' : 'ticker';

  return (
    <div className="overflow-hidden">
      <div
        className="flex"
        style={{
          animation:  `${anim} 60s linear infinite`,
          display:    'inline-flex',
          willChange: 'transform',
        }}
      >
        {doubled.map((q, i) => (
          <QuoteCard key={i} q={q} />
        ))}
        {doubled.map((q, i) => (
          <QuoteCard key={`dup-${i}`} q={q} />
        ))}
      </div>
    </div>
  );
}

export function CommunityTestimonials() {
  return (
    <section className="py-24 overflow-hidden bg-ic-dark/20 border-y border-ic-border">
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="section-label mb-4">FROM THE CIRCLE</p>
            <h2
              className="font-bebas text-white leading-none"
              style={{ fontSize: 'clamp(40px, 8vw, 100px)' }}
            >
              WHAT THEY SAY
            </h2>
          </div>
          <p className="font-mono text-[10px] tracking-widest text-ic-muted hidden md:block max-w-[200px] text-right">
            REAL MEMBERS. REAL CIRCLE. NO PERFORMANCE.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <MarqueeRow quotes={ROW_ONE} />
        <MarqueeRow quotes={ROW_TWO} reverse />
      </div>
    </section>
  );
}
