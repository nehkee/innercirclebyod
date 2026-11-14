/**
 * Brand identity in one place. Inner Circle is artist-neutral: to launch it
 * for a specific artist or label, change these values (and the copy in
 * lib/constants.ts) rather than hunting through components.
 */
export const BRAND = {
  name:        'Inner Circle',
  nameCaps:    'INNER CIRCLE',
  mark:        'IC',
  tagline:     'An Elite Digital Society',
  motto:       'The circle never breaks',
  description: 'A private members society. Secret shows, unreleased music, closed-room access. Entry is earned, not given.',
  /** Who members gather around, in copy ("time with the artist"). */
  artistRef:   'the artist',
  social: {
    x:         process.env.NEXT_PUBLIC_SOCIAL_X || '',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || '',
    tiktok:    process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || '',
    youtube:   process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || '',
  },
} as const;

/** Public site URL (no trailing slash). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/** Site host for display, e.g. "innercircle.club". */
export function siteHost(): string {
  try {
    return new URL(siteUrl()).host.toUpperCase();
  } catch {
    return BRAND.nameCaps;
  }
}

/** Sender address for transactional email (RESEND_FROM_EMAIL), with a display name. */
export function fromEmail(displayName: string = BRAND.name): string {
  const address = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
  return `${displayName} <${address}>`;
}
