import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers/Providers';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { ClerkProvider } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'INNER CIRCLE BY OD | The Machine',
  description: 'An elite digital society built around Odumodublvck. Join the Inner Circle — exclusive access to private events, unreleased music, and the machine.',
  keywords: ['Odumodublvck', 'Inner Circle', 'Native Records', 'Nigerian music', 'exclusive', 'membership', 'fan club'],
  openGraph: {
    title: 'INNER CIRCLE BY OD | The Machine',
    description: 'An elite digital society built around Odumodublvck.',
    url: 'https://innercirclebyod.com',
    siteName: 'Inner Circle by OD',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INNER CIRCLE BY OD | The Machine',
    description: 'An elite digital society built around Odumodublvck.',
    creator: '@Odumodublvck_',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://innercirclebyod.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const page = (
    <html lang="en">
      <body className="bg-od-black text-white font-space antialiased overflow-x-hidden">
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
        </Providers>
      </body>
    </html>
  );

  // ClerkProvider throws without keys, so only mount it once Clerk is configured.
  if (!isClerkConfigured()) return page;

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary:         '#C9A84C',
          colorBackground:      '#111111',
          colorText:            '#FFFFFF',
          colorTextSecondary:   '#9CA3AF',
          colorInputBackground: '#080808',
          colorInputText:       '#FFFFFF',
          borderRadius:         '0px',
          fontFamily:           'Space Grotesk, system-ui, sans-serif',
        },
      }}
    >
      {page}
    </ClerkProvider>
  );
}
