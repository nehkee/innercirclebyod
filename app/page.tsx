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
import { getEvents, getCommunityStats, getLeaderboard } from '@/lib/data';
import { showPlaceholderContent } from '@/lib/placeholder';

// Re-fetch events and stats from Supabase at most once a minute
export const revalidate = 60;

export default async function Home() {
  const [events, stats, leaderboard] = await Promise.all([
    getEvents(),
    getCommunityStats(),
    getLeaderboard(5),
  ]);

  return (
    <main className="bg-ic-black min-h-screen">
      <Nav />

      {/* 1 — Hero: Three.js particles, glitch headline, countdown */}
      <Hero nextEvent={events[0] ?? null} stats={stats} />

      {/* 2 — Statement band: triple-row opposing marquee */}
      <StatementBand />

      {/* 3 — Manifesto: staggered reveal of ethos lines */}
      <ManifestoSection />

      {/* 4 — Membership showcase: expandable tier cards */}
      <MembershipShowcase />

      {/* 5 — Events showcase: featured card + secondary list */}
      <EventsShowcase events={events} />

      {/* 6 — Community testimonials: sample quotes, hidden in production until real ones exist */}
      {showPlaceholderContent() && <CommunityTestimonials />}

      {/* 7 — Stats + Leaderboard */}
      <CommunityStats stats={stats} leaderboard={leaderboard} />

      {/* 8 — Full-viewport "ARE YOU IN?" CTA */}
      <ExclusiveCTA stats={stats} />

      <Footer />
    </main>
  );
}
