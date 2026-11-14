import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin }              from '@/lib/auth';
import { createAdminClient }         from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: check.status });
  }

  const admin = createAdminClient();

  const range = req.nextUrl.searchParams.get('range') ?? '30d';
  const since = new Date();
  switch (range) {
    case '7d':  since.setDate(since.getDate() - 7);   break;
    case '30d': since.setDate(since.getDate() - 30);  break;
    case '90d': since.setDate(since.getDate() - 90);  break;
    default:    since.setDate(since.getDate() - 30);
  }

  const sinceStr = since.toISOString();

  const [
    memberStats,
    tierBreakdown,
    recentTickets,
    recentApplications,
    eventStats,
    revenueByProvider,
    topMembers,
  ] = await Promise.all([
    // Total members + new in range
    admin.from('members').select('id, created_at, tier'),

    // Tier breakdown
    admin
      .from('members')
      .select('tier')
      .is('deleted_at', null),

    // Recent ticket sales
    admin
      .from('tickets')
      .select('id, created_at, payment_status, events(title), members(username)')
      .gte('created_at', sinceStr)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(20),

    // Pending applications
    admin
      .from('applications')
      .select('id, created_at, status, type')
      .order('created_at', { ascending: false })
      .limit(10),

    // Event sell-through
    admin
      .from('events')
      .select('id, title, capacity, sold, date')
      .eq('is_active', true)
      .order('date', { ascending: true })
      .limit(10),

    // Revenue split by payment provider
    admin
      .from('memberships')
      .select('payment_provider, status')
      .eq('status', 'active'),

    // Top leaderboard
    admin
      .from('members')
      .select('id, username, tier, points')
      .order('points', { ascending: false })
      .limit(10),
  ]);

  const members      = memberStats.data ?? [];
  const allMembers   = tierBreakdown.data ?? [];
  const newMembers   = members.filter(m => m.created_at >= sinceStr);

  const tierCounts: Record<string, number> = {};
  for (const m of allMembers) {
    tierCounts[m.tier] = (tierCounts[m.tier] ?? 0) + 1;
  }

  const providerCounts: Record<string, number> = {};
  for (const m of revenueByProvider.data ?? []) {
    providerCounts[m.payment_provider] = (providerCounts[m.payment_provider] ?? 0) + 1;
  }

  const pendingApps = (recentApplications.data ?? []).filter(a => a.status === 'pending');

  return NextResponse.json({
    overview: {
      totalMembers:  members.length,
      newMembers:    newMembers.length,
      activeTickets: recentTickets.data?.length ?? 0,
      pendingApps:   pendingApps.length,
    },
    tierBreakdown: tierCounts,
    events:        eventStats.data ?? [],
    recentTickets: recentTickets.data ?? [],
    applications:  recentApplications.data ?? [],
    paymentSplit:  providerCounts,
    topMembers:    topMembers.data ?? [],
    range,
    generatedAt:   new Date().toISOString(),
  });
}
