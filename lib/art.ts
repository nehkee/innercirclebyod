/** Deterministic generative-art helpers: the same title always produces the same artwork. */

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small seeded PRNG (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TYPE_ACCENT: Record<string, string> = {
  listening_party: '#C9A84C',
  show:            '#CC0000',
  hangout:         '#9CA3AF',
  studio:          '#FFFFFF',
  industry:        '#C9A84C',
  secret:          '#CC0000',
  merch:           '#C9A84C',
  music:           '#9CA3AF',
  ticket:          '#CC0000',
  invite:          '#FFFFFF',
};

export const TYPE_LABEL: Record<string, string> = {
  listening_party: 'LISTENING ROOM',
  show:            'UNDERGROUND SHOW',
  hangout:         'CLOSED DOOR',
  studio:          'STUDIO SESSION',
  industry:        'INDUSTRY NIGHT',
  secret:          'SECRET',
  merch:           'MERCH',
  music:           'MUSIC',
  ticket:          'ACCESS',
  invite:          'INVITATION',
};

export interface Ring { cx: number; cy: number; r: number; width: number; dash: string; opacity: number; rotate: number }

/** Concentric "circle" rings, off-centre, unique per seed (coordinates on a 400x500 canvas). */
export function ringsFor(seedText: string, count = 7): Ring[] {
  const rand = seeded(hashString(seedText));
  const cx = 120 + rand() * 160;
  const cy = 150 + rand() * 140;
  const rings: Ring[] = [];
  let r = 30 + rand() * 30;
  for (let i = 0; i < count; i++) {
    const dashed = rand() > 0.55;
    rings.push({
      cx, cy, r,
      width:   rand() > 0.8 ? 3 : 1,
      dash:    dashed ? `${2 + Math.round(rand() * 14)} ${3 + Math.round(rand() * 10)}` : '',
      opacity: 0.18 + rand() * 0.6,
      rotate:  Math.round(rand() * 360),
    });
    r += 18 + rand() * 34;
  }
  return rings;
}
