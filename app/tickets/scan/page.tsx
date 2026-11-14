import Link from 'next/link';
import { Nav } from '@/components/layout/Nav';

export const metadata = { title: 'Ticket | Inner Circle', robots: { index: false, follow: false } };

/** Where a ticket QR lands if someone scans it with a phone camera instead of the door scanner. */
export default function TicketScanLanding() {
  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <section className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <p className="section-label mb-4">INNER CIRCLE TICKET</p>
          <h1 className="font-bebas text-5xl text-white mb-4">SHOW THIS AT THE DOOR</h1>
          <p className="text-ic-muted mb-8">
            This QR code is your entry pass. The team scans it at the door. It works once, so don&apos;t share it.
          </p>
          <Link href="/account" className="btn-primary px-10 py-3 text-sm">MY TICKETS</Link>
        </div>
      </section>
    </main>
  );
}
