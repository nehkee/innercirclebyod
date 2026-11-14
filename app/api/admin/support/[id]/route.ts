import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { getMembership, effectiveTier } from '@/lib/membership';
import { listMessages, postMessage, updateThread, type ThreadRow } from '@/lib/support/threads';
import { grantEventDiscount, grantMembershipDiscount, grantTierUpgrade, pauseMembership } from '@/lib/support/offers';

export const dynamic = 'force-dynamic';

/** One conversation with the member's value at a glance. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const admin = createAdminClient();
  const { data: thread } = await admin.from('support_threads').select('*').eq('id', params.id).maybeSingle();
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [messages, { data: member }, membership, { data: payments }, { data: refunds }, { data: offers }] = await Promise.all([
    listMessages(thread.id),
    admin.from('members').select('id, username, email, tier, points, created_at').eq('id', thread.member_id).single(),
    getMembership(thread.member_id),
    admin.from('payments').select('amount, currency, status').eq('member_id', thread.member_id).eq('status', 'fulfilled'),
    admin.from('refund_requests').select('id, kind, status, due_at, amount, currency, crypto_address').eq('member_id', thread.member_id).order('created_at', { ascending: false }).limit(5),
    admin.from('member_offers').select('kind, percent, tier, months, source, created_at, used_at').eq('member_id', thread.member_id).order('created_at', { ascending: false }).limit(10),
  ]);

  const spent = { USD: 0, NGN: 0 } as Record<string, number>;
  for (const p of payments ?? []) spent[p.currency] = (spent[p.currency] ?? 0) + Number(p.amount);

  await admin.from('support_threads').update({ team_last_read_at: new Date().toISOString() }).eq('id', thread.id);

  return NextResponse.json({
    thread, messages: messages.filter(m => m.sender !== 'system'),
    member, spent, refunds: refunds ?? [], offers: offers ?? [],
    membership: membership && { ...membership, effectiveTier: effectiveTier(membership) },
  });
}

const Action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('reply'),   body: z.string().trim().min(1).max(4000) }),
  z.object({ type: z.literal('grant'),   offer: z.enum(['event_discount', 'membership_discount', 'tier_upgrade', 'pause']),
             percent: z.number().int().min(1).max(100).optional(), months: z.number().int().min(1).max(12).optional() }),
  z.object({ type: z.literal('resolve'), outcome: z.enum(['saved', 'cancelled', 'refunded', 'resolved']) }),
]);

/** Team actions: reply, grant a perk (applied instantly), or close the conversation. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const parsed = Action.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { data } = await createAdminClient().from('support_threads').select('*').eq('id', params.id).maybeSingle();
  const thread = data as ThreadRow | null;
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const a = parsed.data;
  try {
    if (a.type === 'reply') {
      await postMessage(thread.id, 'team', a.body, { authorId: check.member.id });
      await updateThread(thread.id, { status: 'open' });
      await createAdminClient().from('support_threads').update({ assigned_to: check.member.id }).eq('id', thread.id).is('assigned_to', null);
    } else if (a.type === 'grant') {
      const ctx = { threadId: thread.id, source: 'team' as const, grantedBy: check.member.id };
      const msg =
        a.offer === 'event_discount'      ? await grantEventDiscount(thread.member_id, a.percent, ctx) :
        a.offer === 'membership_discount' ? await grantMembershipDiscount(thread.member_id, a.percent, ctx) :
        a.offer === 'tier_upgrade'        ? await grantTierUpgrade(thread.member_id, a.months, ctx) :
                                            await pauseMembership(thread.member_id, a.months, ctx);
      await postMessage(thread.id, 'team', `🎁 ${msg}`, { authorId: check.member.id });
      await updateThread(thread.id, { status: 'open' });
    } else {
      await updateThread(thread.id, { status: 'resolved', outcome: a.outcome, stage: 'done' });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Action failed' }, { status: 400 });
  }
}
