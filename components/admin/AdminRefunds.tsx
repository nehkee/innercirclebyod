'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock } from 'lucide-react';

interface Refund {
  id: string; kind: string; status: string; amount: number; currency: string; provider: string | null;
  due_at: string; crypto_address: string | null; reason: string | null; note: string | null;
  created_at: string; processed_at: string | null; thread_id: string | null;
  members: { username: string | null; email: string } | null;
  tickets: { events: { title: string } | null } | null;
}

const money = (r: Refund) => `${r.currency === 'NGN' ? '₦' : '$'}${Number(r.amount).toLocaleString()}`;
const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/** Refund queue, ordered by deadline. Policy: processed within 7 days once the member insists. */
export function AdminRefunds({ onOpenThread }: { onOpenThread: (threadId: string) => void }) {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/refunds', { cache: 'no-store' });
    if (!res.ok) { setError('Refunds need Clerk sign-in, an admin account and Supabase.'); return; }
    setError(null);
    setRefunds((await res.json()).refunds);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(r: Refund, action: 'refund' | 'mark_refunded' | 'decline') {
    let note: string | undefined;
    if (action === 'decline') {
      note = window.prompt('Message to the member explaining why (they will see this):') ?? undefined;
      if (!note) return;
    } else if (!window.confirm(`${action === 'refund' ? 'Refund' : 'Mark as refunded'} ${money(r)} for ${r.members?.username ?? 'this member'}?`)) {
      return;
    }
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/refunds/${r.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(body.error ?? 'Failed'); else toast.success(body.message ?? 'Done');
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="font-mono text-xs tracking-widest text-ic-muted py-6">{error}</p>;

  const open = refunds.filter(r => r.status === 'requested');
  const done = refunds.filter(r => r.status !== 'requested');

  return (
    <div className="space-y-8">
      <div>
        <p className="text-ic-muted font-mono text-xs tracking-widest mb-4">
          {open.length} OPEN · TRY A NEW DATE OR A DISCOUNT IN THE CHAT FIRST · PROCESS WITHIN 7 DAYS
        </p>
        {open.length === 0 && <p className="font-mono text-[11px] tracking-widest text-ic-muted">NO OPEN REFUND REQUESTS.</p>}
        <div className="space-y-3">
          {open.map(r => {
            const left = daysLeft(r.due_at);
            return (
              <div key={r.id} className={`border p-5 ${left <= 1 ? 'border-ic-red/60' : 'border-ic-border'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-white">{r.members?.username ?? r.members?.email} · <span className="text-ic-gold">{money(r)}</span></p>
                    <p className="font-mono text-[11px] tracking-widest text-ic-muted">
                      {r.kind.toUpperCase()}{r.tickets?.events ? ` · ${r.tickets.events.title}` : ''} · {(r.provider ?? 'free').toUpperCase()}
                      {r.reason ? ` · REASON: ${r.reason.replace('_', ' ').toUpperCase()}` : ''}
                    </p>
                    {r.crypto_address && <p className="font-mono text-[11px] text-ic-silver break-all mt-1">SEND TO: {r.crypto_address}</p>}
                    {r.note && <p className="font-mono text-[11px] text-ic-red mt-1">{r.note}</p>}
                  </div>
                  <p className={`flex items-center gap-1 font-mono text-[11px] tracking-widest ${left <= 1 ? 'text-ic-red' : 'text-ic-muted'}`}>
                    {left <= 1 ? <AlertTriangle size={12} /> : <Clock size={12} />}
                    {left <= 0 ? 'OVERDUE' : `${left} DAY${left === 1 ? '' : 'S'} LEFT`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.thread_id && (
                      <button onClick={() => onOpenThread(r.thread_id!)} className="border border-ic-border text-ic-silver hover:text-white font-mono text-[11px] tracking-widest px-3 py-2">
                        OPEN CHAT
                      </button>
                    )}
                    {r.provider === 'crypto' ? (
                      <button disabled={busy === r.id} onClick={() => act(r, 'mark_refunded')} className="border border-ic-gold text-ic-gold hover:bg-ic-gold/10 font-mono text-[11px] tracking-widest px-3 py-2">
                        MARK AS REFUNDED
                      </button>
                    ) : (
                      <button disabled={busy === r.id} onClick={() => act(r, 'refund')} className="border border-ic-gold text-ic-gold hover:bg-ic-gold/10 font-mono text-[11px] tracking-widest px-3 py-2">
                        REFUND {money(r)}
                      </button>
                    )}
                    <button disabled={busy === r.id} onClick={() => act(r, 'decline')} className="border border-ic-border text-ic-muted hover:text-ic-red font-mono text-[11px] tracking-widest px-3 py-2">
                      DECLINE
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {done.length > 0 && (
        <div>
          <p className="section-label mb-3">HISTORY</p>
          <div className="border border-ic-border divide-y divide-ic-border/50">
            {done.map(r => (
              <div key={r.id} className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] tracking-widest">
                <span className="text-white">{r.members?.username ?? r.members?.email}</span>
                <span className="text-ic-gold">{money(r)}</span>
                <span className="text-ic-muted">{r.kind.toUpperCase()}</span>
                <span className={r.status === 'refunded' ? 'text-green-400' : r.status === 'failed' ? 'text-ic-red' : 'text-ic-muted'}>{r.status.toUpperCase()}</span>
                {r.note && <span className="text-ic-muted">{r.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
