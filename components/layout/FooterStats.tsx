'use client';

import { useEffect, useState } from 'react';
import type { CommunityStats } from '@/lib/data';
import { formatStat, STAT_LABELS } from '@/lib/data-format';

/** Real community numbers; renders nothing until there's something honest to show. */
export function FooterStats() {
  const [stats, setStats] = useState<CommunityStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setStats(d?.stats ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  const items = (Object.keys(STAT_LABELS) as (keyof CommunityStats)[])
    .map(k => ({ l: STAT_LABELS[k], n: stats[k] }))
    .filter(s => s.n > 0);
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-od-border mb-8">
      {items.map(s => (
        <div key={s.l} className="text-center">
          <p className="font-bebas text-2xl text-od-gold">{formatStat(s.n)}</p>
          <p className="font-mono text-[9px] tracking-[0.3em] text-od-muted">{s.l}</p>
        </div>
      ))}
    </div>
  );
}
