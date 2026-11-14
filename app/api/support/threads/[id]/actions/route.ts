import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/fraud';
import { handleAction } from '@/lib/support/bot';
import { jsonError, memberThread } from '@/lib/support/api';

const Body = z.object({ actionId: z.string().min(1).max(100) });

/** Member taps a quick-reply button (offer, cancel, refund…). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await memberThread(id);
  if (r.error) return r.error;

  const rl = await rateLimit(`support-act:${r.member.id}`, 20, 60 * 1000);
  if (!rl.allowed) return jsonError('Too many taps — try again in a moment.', 429);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('Invalid request', 400);

  try {
    await handleAction(r.thread, r.member, parsed.data.actionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'That option is not available', 400);
  }
}
