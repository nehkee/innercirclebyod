import { Nav } from '@/components/layout/Nav';
import { CheckoutStatus } from '@/components/checkout/CheckoutStatus';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Checkout | Inner Circle', robots: { index: false, follow: false } };

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { payment?: string } }) {
  const paymentId = searchParams.payment ?? '';

  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        {/^[0-9a-f-]{36}$/i.test(paymentId)
          ? <CheckoutStatus paymentId={paymentId} />
          : <p className="font-mono text-xs tracking-widest text-ic-muted">NO PAYMENT SELECTED</p>}
      </section>
    </main>
  );
}
