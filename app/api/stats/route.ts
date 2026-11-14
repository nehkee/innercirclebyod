import { NextResponse } from 'next/server';
import { getCommunityStats } from '@/lib/data';

export const revalidate = 300;

/** Public community numbers for the footer. `stats` is null until there are real members. */
export async function GET() {
  const stats = await getCommunityStats();
  return NextResponse.json(
    { stats },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
