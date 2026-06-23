import { Nav }                    from '@/components/layout/Nav';
import { Footer }                 from '@/components/layout/Footer';
import { Hero }                   from '@/components/sections/Hero';
import { StatementBand }          from '@/components/sections/StatementBand';
import { ManifestoSection }       from '@/components/sections/ManifestoSection';
import { MembershipShowcase }     from '@/components/sections/MembershipShowcase';
import { EventsShowcase }         from '@/components/sections/EventsShowcase';
import { CommunityTestimonials }  from '@/components/sections/CommunityTestimonials';
import { CommunityStats }         from '@/components/sections/CommunityStats';
import { ExclusiveCTA }           from '@/components/sections/ExclusiveCTA';

export default function Home() {
  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      {/* 1 — Hero: Three.js particles, glitch headline, countdown */}
      <Hero />

      {/* 2 — Statement band: triple-row opposing marquee */}
      <StatementBand />

      {/* 3 — Manifesto: staggered reveal of ethos lines */}
      <ManifestoSection />

      {/* 4 — Membership showcase: expandable tier cards */}
      <MembershipShowcase />

      {/* 5 — Events showcase: featured card + secondary list */}
      <EventsShowcase />

      {/* 6 — Community testimonials: dual-direction quote marquee */}
      <CommunityTestimonials />

      {/* 7 — Stats + Leaderboard */}
      <CommunityStats />

      {/* 8 — Full-viewport "ARE YOU IN?" CTA */}
      <ExclusiveCTA />

      <Footer />
    </main>
  );
}
