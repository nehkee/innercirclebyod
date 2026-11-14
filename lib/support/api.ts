import { NextResponse } from 'next/server';
import { getCurrentMember, type CurrentMember } from '@/lib/auth';
import { getThreadForMember, type ThreadRow } from '@/lib/support/threads';

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Signed-in member + their thread, or an error response. */
export async function memberThread(threadId: string): Promise<
  { member: CurrentMember; thread: ThreadRow; error?: never } | { error: NextResponse; member?: never; thread?: never }
> {
  const member = await getCurrentMember();
  if (!member) return { error: jsonError('Sign in to chat with the team', 401) };
  if (!/^[0-9a-f-]{36}$/i.test(threadId)) return { error: jsonError('Not found', 404) };
  const thread = await getThreadForMember(threadId, member.id);
  if (!thread) return { error: jsonError('Not found', 404) };
  return { member, thread };
}

/** Messages as the member sees them (internal system notes hidden). */
export function forMember<T extends { sender: string }>(messages: T[]): T[] {
  return messages.filter(m => m.sender !== 'system');
}
