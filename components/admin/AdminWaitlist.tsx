'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Check } from 'lucide-react';

interface Entry { id: string; name: string; email: string; source: string; converted: boolean; invited_at: string | null; invite_code: string | null; created_at: string }

/** Approve people from the waitlist: one click creates a 14-day invite and emails it. */
export function AdminWaitlist() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'waiting' | 'invited' | 'all'>('waiting');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/waitlist', { cache: 'no-store' });
    if (!res.ok) { setError('The waitlist needs Clerk sign-in, an admin account and Supabase.'); return; }
    setError(null);
    setRows((await res.json()).waitlist);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function invite(e: Entry) {
    setBusy(e.id);
    try {
      const res = await fetch(`/api/admin/waitlist/${e.id}`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.error ?? 'Failed'); return; }
      toast.success(body.emailed ? `Invite emailed to ${e.email}` : `Code ${body.code} created (email not configured — send it yourself)`);
      load();
    } finally { setBusy(null); }
  }

  if (error) return <p className="font-mono text-xs tracking-widest text-ic-muted py-6">{error}</p>;

  const shown = rows.filter(r => filter === 'all' || (filter === 'waiting' ? !r.invited_at : Boolean(r.invited_at)));
  const inviteOnly = process.env.NEXT_PUBLIC_INVITE_ONLY === 'true';

  return (
    <div>
      <p className="font-mono text-[11px] tracking-widest text-ic-muted mb-4">
        {rows.filter(r => !r.invited_at).length} WAITING · {rows.filter(r => r.converted).length} JOINED ·
        INVITATION-ONLY MODE IS <span className={inviteOnly ? 'text-ic-gold' : 'text-ic-silver'}>{inviteOnly ? 'ON' : 'OFF'}</span>
      </p>
      <div className="flex gap-2 mb-4">
        {(['waiting', 'invited', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-mono text-[11px] tracking-widest px-3 py-1.5 border ${filter === f ? 'border-ic-gold text-ic-gold' : 'border-ic-border text-ic-muted'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="font-mono text-[11px] tracking-widest text-ic-muted">NOBODY HERE.</p>}
      <div className="border border-ic-border divide-y divide-ic-border/60">
        {shown.map(r => (
          <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">{r.name}</p>
              <p className="font-mono text-[11px] text-ic-muted break-all">{r.email} · {new Date(r.created_at).toLocaleDateString('en-GB')}</p>
            </div>
            {r.converted ? (
              <span className="flex items-center gap-1 font-mono text-[11px] tracking-widest text-green-400"><Check size={12} /> JOINED</span>
            ) : r.invited_at ? (
              <span className="font-mono text-[11px] tracking-widest text-ic-gold">INVITED · {r.invite_code}</span>
            ) : (
              <button onClick={() => invite(r)} disabled={busy === r.id}
                className="flex items-center gap-1 border border-ic-gold text-ic-gold hover:bg-ic-gold/10 font-mono text-[11px] tracking-widest px-3 py-2 disabled:opacity-50">
                <Send size={12} /> SEND INVITE
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
