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

  // Revenue actually collected (fulfilled, not refunded) and concierge outcomes in range
  const [{ data: paid }, { data: convos }, { count: refundsOpen }] = await Promise.all([
    admin.from('payments').select('amount, currency, kind').eq('status', 'fulfilled').gte('paid_at', sinceStr),
    admin.from('support_threads').select('topic, outcome').in('topic', ['membership', 'ticket']).gte('created_at', sinceStr),
    admin.from('refund_requests').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
  ]);
  const revenue = { USD: 0, NGN: 0 } as Record<string, number>;
  for (const p of paid ?? []) revenue[p.currency] = (revenue[p.currency] ?? 0) + Number(p.amount);
  const outcomes = { saved: 0, cancelled: 0, refund_requested: 0, refunded: 0, open: 0 } as Record<string, number>;
  for (const c of convos ?? []) outcomes[c.outcome ?? 'open'] = (outcomes[c.outcome ?? 'open'] ?? 0) + 1;
  const decided = outcomes.saved + outcomes.cancelled + outcomes.refund_requested + outcomes.refunded;

  return NextResponse.json({
    revenue: { ...revenue, orders: paid?.length ?? 0 },
    retention: { ...outcomes, saveRate: decided ? Math.round((outcomes.saved / decided) * 100) : null, refundsOpen: refundsOpen ?? 0 },
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
