import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers/Providers';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { ChatWidget } from '@/components/support/ChatWidget';
import { Analytics } from '@vercel/analytics/react';
import { bebas, spaceGrotesk, jetbrainsMono } from './fonts';
import { ClerkProvider } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/auth';
import { BRAND, siteUrl } from '@/lib/brand';

export const metadata: Metadata = {
  title: { default: 'INNER CIRCLE | An Elite Digital Society', template: '%s' },
  description: BRAND.description,
  keywords: ['Inner Circle', 'private members club', 'exclusive events', 'listening party', 'membership', 'underground music'],
  openGraph: {
    title: 'INNER CIRCLE | An Elite Digital Society',
    description: BRAND.description,
    url: siteUrl(),
    siteName: BRAND.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INNER CIRCLE | An Elite Digital Society',
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(siteUrl()),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const page = (
    <html lang="en" className={`${bebas.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-ic-black text-white font-space antialiased overflow-x-hidden">
        {/* Without JavaScript, scroll-reveal content would stay invisible: force it visible. */}
        <noscript>
          <style
            // Raw string: JSX would HTML-escape the quotes and break the selectors
            dangerouslySetInnerHTML={{
              __html:
                '[style$="opacity:0"],[style*="opacity:0;"]{opacity:1!important}' +
                '[style*="transform:translate"]{transform:none!important}' +
                '.cursor-dot,.cursor-ring{display:none}',
            }}
          />
        </noscript>
        <Providers authEnabled={isClerkConfigured()}>
          <NoiseOverlay />
          <CustomCursor />
          {children}
          <ChatWidget />
        </Providers>
        {/* Cookieless, aggregated page analytics (only active on Vercel) */}
        <Analytics />
      </body>
    </html>
  );

  // ClerkProvider throws without keys, so only mount it once Clerk is configured.
  if (!isClerkConfigured()) return page;

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary:         '#C9A84C',
          colorBackground:      '#111111',
          colorForeground:      '#FFFFFF',
          colorMutedForeground: '#9CA3AF',
          colorInput:           '#080808',
          colorInputForeground: '#FFFFFF',
          borderRadius:         '0px',
          fontFamily:           'Space Grotesk, system-ui, sans-serif',
        },
      }}
    >
      {page}
    </ClerkProvider>
  );
}
