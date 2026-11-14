import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Nav } from '@/components/layout/Nav';
import { verifyMemberCardToken, getMemberCard } from '@/lib/member-card';
import { isSupabaseConfigured } from '@/lib/supabase';
import { TIERS } from '@/lib/constants';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Verify member | Inner Circle', robots: { index: false, follow: false } };

/** Scanned from a membership card: confirms the holder is a current member (shows handle and tier only). */
export default async function VerifyPage({ searchParams }: { searchParams: { m?: string } }) {
  const memberId = searchParams.m ? verifyMemberCardToken(searchParams.m) : null;
  const card = memberId && isSupabaseConfigured() ? await getMemberCard(memberId) : null;
  const tier = TIERS.find(t => t.id === card?.tier);
  const valid = Boolean(card && card.tier);

  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <section className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className={`max-w-md w-full border-2 p-10 ${valid ? 'border-green-500/60' : 'border-ic-red/60'}`}>
          {valid && card ? (
            <>
              <CheckCircle2 size={56} className="mx-auto text-green-400 mb-4" />
              <p className="section-label mb-2">VERIFIED MEMBER</p>
              <p className="font-bebas text-6xl leading-none mb-2" style={{ color: tier?.color }}>{tier?.name}</p>
              <p className="font-mono text-white tracking-widest">{card.username}</p>
              <p className="font-mono text-[11px] tracking-widest text-ic-muted mt-2">{card.number} · SINCE {card.since}</p>
            </>
          ) : (
            <>
              <XCircle size={56} className="mx-auto text-ic-red mb-4" />
              <p className="font-bebas text-5xl text-white mb-2">NOT VERIFIED</p>
              <p className="text-ic-muted text-sm">This card isn&apos;t valid, or the membership has ended.</p>
            </>
          )}
          <Link href="/" className="inline-block mt-8 font-mono text-[11px] tracking-widest text-ic-muted hover:text-ic-gold">INNER CIRCLE →</Link>
        </div>
      </section>
    </main>
  );
}
