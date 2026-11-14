'use client';

interface Row {
  text:      string;
  direction: 'left' | 'right';
  speed:     number; // seconds
  color:     string;
  size:      string;
}

const ROWS: Row[] = [
  {
    text:      'INNER CIRCLE  ✦  ENTER THE CIRCLE  ✦  BY INVITATION ONLY  ✦  EXCLUSIVE ACCESS  ✦  THE UNDERGROUND  ✦  NO PHONES  ✦',
    direction: 'left',
    speed:     28,
    color:     '#C9A84C',
    size:      'clamp(22px, 3.5vw, 42px)',
  },
  {
    text:      'NO HALF MEASURES  —  ALL OR NOTHING  —  UNDERGROUND LUXURY  —  CLOSED ROOMS  —  FIRST LISTEN  —  STREETS CERTIFIED  —  NO LEAKS  —',
    direction: 'right',
    speed:     36,
    color:     '#FFFFFF',
    size:      'clamp(18px, 2.5vw, 32px)',
  },
  {
    text:      'EARNED  ·  NOT GIVEN  ·  BORN IN THE UNDERGROUND  ·  RAISED IN THE INDUSTRY  ·  THE CIRCLE NEVER BREAKS  ·  ◯  ·',
    direction: 'left',
    speed:     55,
    color:     '#2A2A2A',
    size:      'clamp(13px, 1.8vw, 22px)',
  },
];

export function StatementBand() {
  return (
    <div className="py-10 overflow-hidden border-y border-ic-border bg-ic-black space-y-6">
      {ROWS.map((row, i) => {
        const content = `${row.text}  ${row.text}`;
        const animName = row.direction === 'left' ? 'ticker' : 'ticker-rev';

        return (
          <div key={i} className="overflow-hidden">
            <div
              className="whitespace-nowrap font-bebas tracking-widest"
              style={{
                fontSize:         row.size,
                color:            row.color,
                animation:        `${animName} ${row.speed}s linear infinite`,
                display:          'inline-block',
                willChange:       'transform',
              }}
            >
              {content}&nbsp;&nbsp;&nbsp;&nbsp;{content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
