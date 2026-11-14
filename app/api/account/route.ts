import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { effectiveTier, getMembership } from '@/lib/membership';
import { resumeMembership } from '@/lib/support/refunds';

export const dynamic = 'force-dynamic';

/** Everything the "My membership" page needs. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const m = await getMembership(member.id);

  const [{ data: tickets }, { data: offers }, { data: refunds }] = await Promise.all([
    admin.from('tickets')
      .select('id, status, created_at, events (id, title, date, location, venue)')
      .eq('user_id', member.id)
      .in('status', ['valid', 'used'])
      .order('created_at', { ascending: false })
      .limit(20),
    admin.from('member_offers')
      .select('id, kind, percent, expires_at')
      .eq('member_id', member.id)
      .in('kind', ['event_discount', 'membership_discount'])
      .is('used_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    admin.from('refund_requests')
      .select('id, kind, status, due_at, amount, currency')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    member: { username: member.username, email: member.email },
    membership: m && {
      tier:                 m.tier,
      effectiveTier:        effectiveTier(m),
      status:               m.status,
      provider:             m.payment_provider,
      autoRenews:           Boolean(m.stripe_sub_id) && !m.cancel_at_period_end,
      currentPeriodEnd:     m.current_period_end,
      cancelAtPeriodEnd:    m.cancel_at_period_end,
      pausedUntil:          m.paused_until,
      bonusTier:            m.bonus_tier,
      bonusUntil:           m.bonus_until,
    },
    tickets: (tickets ?? []).map(t => ({ ...t, event: Array.isArray(t.events) ? t.events[0] : t.events })),
    offers:  offers ?? [],
    refunds: refunds ?? [],
  });
}

/** Undo a pending cancellation. (Cancelling itself goes through the concierge chat.) */
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = z.object({ action: z.literal('resume') }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  return NextResponse.json({ message: await resumeMembership(member.id) });
}
