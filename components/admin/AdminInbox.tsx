'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Gift, Check, Loader2, Crown, ArrowUpRight, Pause, Percent } from 'lucide-react';
import { RETENTION } from '@/lib/support/config';

interface ThreadListItem {
  id: string; topic: string; status: string; reason: string | null; outcome: string | null; updated_at: string;
  members: { username: string | null; email: string; tier: string } | null;
  tickets: { events: { title: string } | null } | null;
}
interface Msg { id: string; sender: string; body: string; created_at: string }
interface Detail {
  thread: { id: string; topic: string; status: string; reason: string | null; outcome: string | null };
  messages: Msg[];
  member: { username: string | null; email: string; points: number; created_at: string } | null;
  membership: { tier: string; effectiveTier: string | null; status: string; payment_provider: string | null; current_period_end: string | null; cancel_at_period_end: boolean } | null;
  spent: Record<string, number>;
  refunds: { id: string; kind: string; status: string; due_at: string; amount: number; currency: string }[];
  offers: { kind: string; percent: number | null; months: number | null; source: string; created_at: string }[];
}

const STATUS_TONE: Record<string, string> = {
  waiting_team: 'text-ic-red border-ic-red/40',
  open:         'text-ic-gold border-ic-gold/40',
  bot:          'text-ic-silver border-ic-border',
  resolved:     'text-ic-muted border-ic-border',
};
const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${Math.max(1, m)}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
};

/** Retention inbox: every conversation that needs a human, with one-click perks. */
export function AdminInbox({ initialThread = null }: { initialThread?: string | null }) {
  const [filter, setFilter]   = useState<'active' | 'resolved' | 'all'>('active');
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [selected, setSelected] = useState<string | null>(initialThread);
  const [detail, setDetail]   = useState<Detail | null>(null);
  const [reply, setReply]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const listEnd = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/admin/support?status=${filter}`, { cache: 'no-store' });
    if (!res.ok) { setError('Inbox needs Clerk sign-in, an admin account and Supabase.'); return; }
    setError(null);
    setThreads((await res.json()).threads);
  }, [filter]);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/support/${id}`, { cache: 'no-store' });
    if (res.ok) setDetail(await res.json());
  }, []);

  useEffect(() => { loadList(); const t = setInterval(loadList, 10_000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => {
    if (!selected) return;
    loadDetail(selected);
    const t = setInterval(() => loadDetail(selected), 5_000);
    return () => clearInterval(t);
  }, [selected, loadDetail]);
  useEffect(() => { listEnd.current?.scrollIntoView({ block: 'end' }); }, [detail?.messages.length]);


  async function act(payload: Record<string, unknown>, success: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/support/${selected}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.error ?? 'Action failed'); return; }
      toast.success(success);
      await Promise.all([loadDetail(selected), loadList()]);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    await act({ type: 'reply', body: reply.trim() }, 'Sent');
    setReply('');
  }

  if (error) return <p className="font-mono text-xs tracking-widest text-ic-muted py-6">{error}</p>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-[70vh]">
      {/* Thread list */}
      <div className="xl:col-span-4 border border-ic-border flex flex-col">
        <div className="flex border-b border-ic-border">
          {(['active', 'resolved', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-3 font-mono text-[11px] tracking-widest ${filter === f ? 'text-ic-gold border-b-2 border-ic-gold' : 'text-ic-muted'}`}>
              {f === 'active' ? 'NEEDS US' : f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto max-h-[70vh]">
          {threads.length === 0 && <p className="p-6 font-mono text-[11px] tracking-widest text-ic-muted">NOTHING HERE. QUIET IN THE CIRCLE.</p>}
          {threads.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`w-full text-left p-4 border-b border-ic-border/50 hover:bg-ic-gray/40 ${selected === t.id ? 'bg-ic-gray/60' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-sm text-white truncate">{t.members?.username ?? t.members?.email ?? 'Member'}</span>
                <span className="font-mono text-[10px] text-ic-muted">{ago(t.updated_at)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-[10px] tracking-widest border px-1.5 py-0.5 ${STATUS_TONE[t.status] ?? ''}`}>
                  {t.status === 'waiting_team' ? 'WAITING' : t.status.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] tracking-widest text-ic-muted">
                  {t.topic.toUpperCase()}{t.tickets?.events ? ` · ${t.tickets.events.title}` : ''}{t.reason ? ` · ${t.reason.replace('_', ' ').toUpperCase()}` : ''}
                </span>
                {t.outcome && <span className="font-mono text-[10px] tracking-widest text-ic-gold">{t.outcome.replace('_', ' ').toUpperCase()}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="xl:col-span-5 border border-ic-border flex flex-col min-h-[50vh]">
        {!detail || !selected ? (
          <p className="m-auto font-mono text-[11px] tracking-widest text-ic-muted">SELECT A CONVERSATION</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
              {detail.messages.map(m => (
                <div key={m.id} className={`flex ${m.sender === 'member' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap break-words border ${
                    m.sender === 'member' ? 'bg-ic-gray border-ic-border text-white'
                    : m.sender === 'team' ? 'bg-ic-gold/15 border-ic-gold/30 text-white'
                    : 'bg-transparent border-ic-border/60 text-ic-muted'}`}>
                    <p className="font-mono text-[10px] tracking-widest mb-1 text-ic-gold">
                      {m.sender === 'member' ? 'MEMBER' : m.sender === 'team' ? 'TEAM' : 'CONCIERGE (AUTO)'} · {ago(m.created_at)}
                    </p>
                    {m.body}
                  </div>
                </div>
              ))}
              <div ref={listEnd} />
            </div>
            <form onSubmit={sendReply} className="border-t border-ic-border p-3 flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply as the team…" maxLength={4000}
                className="flex-1 bg-ic-black border border-ic-border text-white text-sm px-3 py-2 focus:outline-none focus:border-ic-gold" />
              <button disabled={busy || !reply.trim()} className="px-3 border border-ic-gold text-ic-gold disabled:opacity-40" aria-label="Send">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Member value + perks */}
      <div className="xl:col-span-3 space-y-4">
        {detail && selected && (
          <>
            <div className="border border-ic-border p-4">
              <p className="section-label mb-3 flex items-center gap-2"><Crown size={12} /> MEMBER</p>
              <p className="font-mono text-sm text-white">{detail.member?.username ?? '—'}</p>
              <p className="font-mono text-[11px] text-ic-muted break-all mb-3">{detail.member?.email}</p>
              <dl className="grid grid-cols-2 gap-2 font-mono text-[11px] tracking-widest">
                <dt className="text-ic-muted">TIER</dt><dd className="text-ic-gold">{(detail.membership?.effectiveTier ?? 'NONE').toUpperCase()}</dd>
                <dt className="text-ic-muted">PAYS BY</dt><dd className="text-white">{(detail.membership?.payment_provider ?? '—').toUpperCase()}</dd>
                <dt className="text-ic-muted">LIFETIME</dt>
                <dd className="text-white">{[detail.spent.USD ? `$${detail.spent.USD.toLocaleString()}` : '', detail.spent.NGN ? `₦${detail.spent.NGN.toLocaleString()}` : ''].filter(Boolean).join(' + ') || '—'}</dd>
                <dt className="text-ic-muted">STATUS</dt>
                <dd className={detail.membership?.cancel_at_period_end ? 'text-ic-red' : 'text-white'}>
                  {detail.membership?.cancel_at_period_end ? 'CANCELLING' : (detail.membership?.status ?? '—').toUpperCase()}
                </dd>
              </dl>
            </div>

            <div className="border border-ic-border p-4">
              <p className="section-label mb-3 flex items-center gap-2"><Gift size={12} /> WIN THEM BACK</p>
              <div className="space-y-2">
                <PerkButton icon={<Percent size={14} />} label={`${RETENTION.eventDiscountPercent}% off next event`} disabled={busy}
                  onClick={() => act({ type: 'grant', offer: 'event_discount', percent: RETENTION.eventDiscountPercent }, 'Event discount granted')} />
                <PerkButton icon={<Percent size={14} />} label={`${RETENTION.membershipDiscountPercent}% off next month`} disabled={busy}
                  onClick={() => act({ type: 'grant', offer: 'membership_discount', percent: RETENTION.membershipDiscountPercent }, 'Membership discount granted')} />
                <PerkButton icon={<ArrowUpRight size={14} />} label={`Upgrade a tier, same price (${RETENTION.upgradeMonths} mo)`} disabled={busy}
                  onClick={() => act({ type: 'grant', offer: 'tier_upgrade', months: RETENTION.upgradeMonths }, 'Upgrade granted')} />
                <PerkButton icon={<Pause size={14} />} label={`Pause ${RETENTION.pauseMonths} month (card only)`} disabled={busy}
                  onClick={() => act({ type: 'grant', offer: 'pause', months: RETENTION.pauseMonths }, 'Membership paused')} />
              </div>
              <p className="font-mono text-[10px] tracking-widest text-ic-muted mt-3">PERKS APPLY INSTANTLY AND THE MEMBER IS TOLD IN THE CHAT.</p>
            </div>

            {detail.refunds.some(r => r.status === 'requested') && (
              <div className="border border-ic-red/40 p-4">
                <p className="section-label mb-2 text-ic-red">REFUND REQUESTED</p>
                {detail.refunds.filter(r => r.status === 'requested').map(r => (
                  <p key={r.id} className="font-mono text-[11px] tracking-widest text-ic-silver">
                    {r.kind.toUpperCase()} · {r.currency === 'NGN' ? '₦' : '$'}{Number(r.amount).toLocaleString()} · DUE {new Date(r.due_at).toLocaleDateString('en-GB').toUpperCase()}
                  </p>
                ))}
                <p className="font-mono text-[10px] tracking-widest text-ic-muted mt-2">OFFER A NEW DATE OR DISCOUNT FIRST. PROCESS IN THE REFUNDS TAB.</p>
              </div>
            )}

            <div className="flex gap-2">
              <button disabled={busy} onClick={() => act({ type: 'resolve', outcome: 'saved' }, 'Marked as saved')}
                className="flex-1 flex items-center justify-center gap-1 border border-green-500/40 text-green-400 hover:bg-green-500/10 font-mono text-[11px] tracking-widest py-2">
                <Check size={12} /> SAVED
              </button>
              <button disabled={busy} onClick={() => act({ type: 'resolve', outcome: 'resolved' }, 'Closed')}
                className="flex-1 border border-ic-border text-ic-muted hover:text-white font-mono text-[11px] tracking-widest py-2">
                CLOSE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PerkButton(props: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={props.onClick} disabled={props.disabled}
      className="w-full flex items-center gap-2 text-left border border-ic-gold/40 text-ic-gold hover:bg-ic-gold/10 px-3 py-2 text-xs disabled:opacity-50">
      {props.icon} {props.label}
    </button>
  );
}
