import { CommunityView } from '@/components/community/CommunityView';
import { getCommunityStats, getLeaderboard } from '@/lib/data';
import { showPlaceholderContent } from '@/lib/placeholder';

export const revalidate = 60;
export const metadata   = { title: 'Community | Inner Circle' };

export default async function CommunityPage() {
  const [stats, leaderboard] = await Promise.all([getCommunityStats(), getLeaderboard(10)]);
  return <CommunityView stats={stats} leaderboard={leaderboard} showSamples={showPlaceholderContent()} />;
}
