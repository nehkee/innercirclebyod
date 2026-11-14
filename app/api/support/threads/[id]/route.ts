import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { listMessages } from '@/lib/support/threads';
import { forMember, memberThread } from '@/lib/support/api';

export const dynamic = 'force-dynamic';

/** Messages in a conversation (optionally only those after ?after=ISO). Marks them read. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await memberThread(params.id);
  if (r.error) return r.error;

  const after = req.nextUrl.searchParams.get('after');
  const messages = forMember(await listMessages(r.thread.id, after));
  await createAdminClient()
    .from('support_threads')
    .update({ member_last_read_at: new Date().toISOString() })
    .eq('id', r.thread.id);

  return NextResponse.json({
    thread:   { id: r.thread.id, topic: r.thread.topic, status: r.thread.status, stage: r.thread.stage },
    messages,
  });
}
