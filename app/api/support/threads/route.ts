import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/fraud';
import { startThread } from '@/lib/support/bot';
import { listMessages } from '@/lib/support/threads';
import { forMember, jsonError } from '@/lib/support/api';

export const dynamic = 'force-dynamic';

/** The member's conversations, newest first, with unread counts. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member) return jsonError('Sign in to chat with the team', 401);

  const admin = createAdminClient();
  const { data: threads } = await admin
    .from('support_threads')
    .select('id, topic, ticket_id, status, outcome, member_last_read_at, updated_at')
    .eq('member_id', member.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  const withUnread = await Promise.all((threads ?? []).map(async t => {
    const { count } = await admin
      .from('support_messages')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', t.id)
      .in('sender', ['team', 'bot'])
      .gt('created_at', t.member_last_read_at);
    return { ...t, unread: count ?? 0 };
  }));

  return NextResponse.json({ threads: withUnread, unread: withUnread.reduce((n, t) => n + t.unread, 0) });
}

const StartBody = z.object({
  topic:    z.enum(['membership', 'ticket', 'general']),
  ticketId: z.string().uuid().optional(),
});

/** Open (or resume) a conversation about a topic. */
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return jsonError('Sign in to chat with the team', 401);

  const rl = await rateLimit(`support-start:${member.id}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return jsonError('Too many requests. Try again shortly.', 429);

  const parsed = StartBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('Invalid request', 400);

  try {
    const thread = await startThread(member, parsed.data.topic, parsed.data.ticketId ?? null);
    const messages = forMember(await listMessages(thread.id));
    return NextResponse.json({ thread, messages });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Could not open chat', 400);
  }
}
