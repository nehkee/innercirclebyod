/** Shared formatting for stats; safe to import from client components. */
export function formatStat(n: number): string {
  return n.toLocaleString('en-US');
}

export const STAT_LABELS = {
  members:   'MEMBERS',
  events:    'EVENTS',
  cities:    'CITIES',
  countries: 'COUNTRIES',
} as const;

/** Country code → flag emoji ('NG' → 🇳🇬). Returns '' for missing/invalid codes. */
export function countryFlag(code?: string | null): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1f1a5 + c.charCodeAt(0)));
}
