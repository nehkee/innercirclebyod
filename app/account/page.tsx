import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { AccountView } from '@/components/account/AccountView';
import { isClerkConfigured } from '@/lib/auth';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'My Membership | Inner Circle', robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="section-label mb-4">YOUR SEAT</p>
          <h1 className="font-bebas gold-text leading-none mb-12" style={{ fontSize: 'clamp(56px, 12vw, 140px)' }}>
            MY CIRCLE
          </h1>
          <AccountView authEnabled={isClerkConfigured()} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
