import Link from 'next/link';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { BRAND } from '@/lib/brand';

export interface LegalSection { title: string; body: React.ReactNode }

/** Shared layout for Privacy Policy and Terms: readable measure, numbered sections, table of contents. */
export function LegalPage({ label, title, intro, sections }: {
  label: string; title: string; intro: React.ReactNode; sections: LegalSection[];
}) {
  const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />
      <article className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="section-label mb-4">{label}</p>
          <h1 className="font-bebas gold-text leading-none mb-6" style={{ fontSize: 'clamp(52px, 11vw, 120px)' }}>{title}</h1>
          <p className="font-mono text-[11px] tracking-widest text-ic-muted mb-10">
            LAST UPDATED {BRAND.legal.lastUpdated.toUpperCase()} · {BRAND.legal.entity.toUpperCase()}
          </p>
          <div className="text-ic-silver leading-relaxed mb-12 space-y-4">{intro}</div>

          <nav aria-label="Contents" className="border border-ic-border p-6 mb-14">
            <p className="section-label mb-4">CONTENTS</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#${slug(s.title)}`} className="text-ic-silver hover:text-ic-gold">
                    <span className="font-mono text-ic-muted mr-2">{String(i + 1).padStart(2, '0')}</span>{s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-12">
            {sections.map((s, i) => (
              <section key={s.title} id={slug(s.title)} className="scroll-mt-28">
                <h2 className="font-bebas text-3xl text-white mb-4 flex gap-4 items-baseline">
                  <span className="font-mono text-base text-ic-border">{String(i + 1).padStart(2, '0')}</span>
                  {s.title.toUpperCase()}
                </h2>
                <div className="text-ic-muted leading-relaxed space-y-3 [&_strong]:text-white [&_a]:text-ic-gold [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-16 text-sm text-ic-muted">
            Questions? Email <a className="text-ic-gold hover:underline" href={`mailto:${BRAND.legal.contactEmail}`}>{BRAND.legal.contactEmail}</a> or
            message the team from <Link href="/account" className="text-ic-gold hover:underline">your account</Link>.
          </p>
        </div>
      </article>
      <Footer />
    </main>
  );
}
