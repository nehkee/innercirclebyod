import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers/Providers';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { CustomCursor } from '@/components/ui/CustomCursor';

export const metadata: Metadata = {
  title: 'INNER CIRCLE BY OD | The Machine',
  description: 'An elite digital society built around Odumodublvck. Join the Inner Circle — exclusive access to private events, unreleased music, and the machine.',
  keywords: ['Odumodublvck', 'Inner Circle', 'Native Records', 'Nigerian music', 'exclusive', 'membership', 'fan club'],
  openGraph: {
    title: 'INNER CIRCLE BY OD | The Machine',
    description: 'An elite digital society built around Odumodublvck.',
    url: 'https://innercirclebyod.com',
    siteName: 'Inner Circle by OD',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Inner Circle by OD',
      },
    ],
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
  return (
    <html lang="en">
      <body className="bg-od-black text-white font-space antialiased overflow-x-hidden">
        <Providers>
          <NoiseOverlay />
          <CustomCursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
