import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/fraud';
import { handleMemberText } from '@/lib/support/bot';
import { getThreadForMember } from '@/lib/support/threads';
import { jsonError, memberThread } from '@/lib/support/api';

const Body = z.object({ body: z.string().trim().min(1).max(2000) });

/** Member sends a free-text message. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await memberThread(params.id);
  if (r.error) return r.error;

  const rl = await rateLimit(`support-msg:${r.member.id}`, 30, 60 * 1000);
  if (!rl.allowed) return jsonError('Slow down a little — try again in a moment.', 429);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('Message is empty or too long', 400);

  await handleMemberText(r.thread, r.member, parsed.data.body);
  const thread = await getThreadForMember(r.thread.id, r.member.id);
  return NextResponse.json({ ok: true, status: thread?.status });
}
