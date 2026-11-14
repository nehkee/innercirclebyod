import localFont from 'next/font/local';

// Self-hosted (SIL Open Font License, see app/fonts/*-OFL.txt): no request to
// Google at runtime, no render-blocking stylesheet, no layout shift.

export const bebas = localFont({
  src:      './fonts/bebas-neue-400.woff2',
  variable: '--font-bebas',
  display:  'swap',
  fallback: ['Impact', 'Arial Narrow', 'sans-serif'],
});

export const spaceGrotesk = localFont({
  src: [
    { path: './fonts/space-grotesk-300.woff2', weight: '300' },
    { path: './fonts/space-grotesk-400.woff2', weight: '400' },
    { path: './fonts/space-grotesk-500.woff2', weight: '500' },
    { path: './fonts/space-grotesk-600.woff2', weight: '600' },
    { path: './fonts/space-grotesk-700.woff2', weight: '700' },
  ],
  variable: '--font-space',
  display:  'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-400.woff2', weight: '400' },
    { path: './fonts/jetbrains-mono-500.woff2', weight: '500' },
    { path: './fonts/jetbrains-mono-700.woff2', weight: '700' },
  ],
  variable: '--font-mono',
  display:  'swap',
  fallback: ['Courier New', 'monospace'],
});
