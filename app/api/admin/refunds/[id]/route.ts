import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { declineRefund, executeRefund } from '@/lib/support/refunds';
import { postMessage, updateThread } from '@/lib/support/threads';
import { reportError } from '@/lib/alerts';

const Body = z.object({
  action: z.enum(['refund', 'mark_refunded', 'decline']),
  note:   z.string().max(500).optional(),
});

/** Process a refund request: refund via the provider, mark a manual crypto refund, or decline. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { data: request } = await createAdminClient().from('refund_requests').select('thread_id').eq('id', id).maybeSingle();
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    if (parsed.data.action === 'decline') {
      await declineRefund(id, check.member.id, parsed.data.note ?? 'Declined');
      if (request.thread_id) await postMessage(request.thread_id, 'team', parsed.data.note || 'We were not able to approve this refund. Reply here if you have questions.', { authorId: check.member.id });
      return NextResponse.json({ ok: true, message: 'Declined' });
    }

    const message = await executeRefund(id, check.member.id, { manualConfirm: parsed.data.action === 'mark_refunded' });
    if (request.thread_id) {
      await postMessage(request.thread_id, 'team', 'Your refund has been processed. It can take a few business days to show on your statement. We hope to see you back in the circle.', { authorId: check.member.id });
      await updateThread(request.thread_id, { status: 'resolved', outcome: 'refunded', stage: 'done' });
    }
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    if (!(err instanceof Error && err.message.includes('sent manually'))) await reportError('Refund failed', err, { refundRequest: id });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Refund failed' }, { status: 400 });
  }
}
