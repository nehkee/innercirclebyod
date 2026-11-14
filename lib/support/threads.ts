import { createAdminClient } from '@/lib/supabase';

export type Topic  = 'membership' | 'ticket' | 'general';
export type Sender = 'member' | 'team' | 'bot' | 'system';

/** A quick-reply button. `id` is what the client sends back to /actions. */
export interface ChatAction {
  id:      string;
  label:   string;
  style?:  'primary' | 'danger' | 'quiet';
}

export interface ThreadRow {
  id:                  string;
  member_id:           string;
  topic:               Topic;
  ticket_id:           string | null;
  status:              'bot' | 'waiting_team' | 'open' | 'resolved';
  stage:               string;
  reason:              string | null;
  outcome:             string | null;
  member_last_read_at: string;
  team_last_read_at:   string | null;
  created_at:          string;
  updated_at:          string;
}

export interface MessageRow {
  id:         string;
  thread_id:  string;
  sender:     Sender;
  author_id:  string | null;
  body:       string;
  actions:    ChatAction[] | null;
  created_at: string;
}

export async function postMessage(
  threadId: string,
  sender: Sender,
  body: string,
  opts: { actions?: ChatAction[]; authorId?: string } = {}
): Promise<MessageRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('support_messages')
    .insert({
      thread_id: threadId,
      sender,
      body:      body.slice(0, 4000),
      actions:   opts.actions?.length ? opts.actions : null,
      author_id: opts.authorId ?? null,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(`Could not post message: ${error?.message}`);
  await admin.from('support_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);
  return data as MessageRow;
}

export async function updateThread(threadId: string, patch: Partial<Pick<ThreadRow, 'status' | 'stage' | 'reason' | 'outcome'>> & { assigned_to?: string | null }) {
  await createAdminClient()
    .from('support_threads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', threadId);
}

export async function getThreadForMember(threadId: string, memberId: string): Promise<ThreadRow | null> {
  const { data } = await createAdminClient()
    .from('support_threads')
    .select('*')
    .eq('id', threadId)
    .eq('member_id', memberId)
    .maybeSingle();
  return (data as ThreadRow | null) ?? null;
}

export async function listMessages(threadId: string, after?: string | null): Promise<MessageRow[]> {
  let q = createAdminClient()
    .from('support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (after) q = q.gt('created_at', after);
  const { data } = await q;
  return (data as MessageRow[] | null) ?? [];
}
