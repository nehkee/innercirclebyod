import { Suspense } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CircleField } from '@/components/art/CircleField';
import { InviteRedeem } from '@/components/invite/InviteRedeem';
import { isClerkConfigured } from '@/lib/auth';

export const metadata = { title: 'Invitation | Inner Circle', robots: { index: false, follow: false } };

export default function InvitePage() {
  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <section className="relative isolate overflow-hidden min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <CircleField className="absolute -z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130vmin] h-[130vmin] opacity-70" />
        <div className="w-full max-w-xl text-center">
          <p className="section-label mb-4">BY INVITATION ONLY</p>
          <h1 className="font-bebas gold-text leading-none mb-10" style={{ fontSize: 'clamp(56px, 12vw, 130px)' }}>YOUR SEAT</h1>
          <Suspense fallback={null}>
            <InviteRedeem authEnabled={isClerkConfigured()} />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
