'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, KeyRound, Loader2 } from 'lucide-react';

interface Invite { code: string; used: boolean; expires_at: string | null; created_at: string }

/** VANGUARD+ members can bring people into the circle with single-use invite codes. */
export function AccountInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canInvite, setCanInvite] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/invites?mine=1', { cache: 'no-store' });
    if (!res.ok) return;
    const body = await res.json();
    setInvites(body.invites ?? []);
    setCanInvite(Boolean(body.canInvite));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.error ?? 'Could not create invite'); return; }
      await navigator.clipboard?.writeText(body.inviteUrl).catch(() => {});
      toast.success('Invite created — link copied');
      load();
    } finally { setBusy(false); }
  }

  const copy = (code: string) => {
    navigator.clipboard?.writeText(`${window.location.origin}/invite?code=${code}`).then(() => toast.success('Link copied')).catch(() => {});
  };

  if (!canInvite && invites.length === 0) return null;

  return (
    <section className="lg:col-span-3 border border-ic-border p-6 md:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <p className="section-label flex items-center gap-2"><KeyRound size={12} /> YOUR INVITES</p>
        {canInvite && (
          <button onClick={create} disabled={busy} className="btn-primary px-6 py-2 text-xs flex items-center gap-2">
            {busy && <Loader2 size={12} className="animate-spin" />} CREATE INVITE
          </button>
        )}
      </div>
      <p className="text-ic-muted text-sm mb-5">Each code works once and expires after 7 days. Bring in people who belong here — you earn 500 points when they join.</p>
      {invites.length === 0 ? (
        <p className="font-mono text-[11px] tracking-widest text-ic-muted">NO INVITES YET.</p>
      ) : (
        <ul className="divide-y divide-ic-border">
          {invites.map(i => {
            const expired = i.expires_at && new Date(i.expires_at) < new Date();
            return (
              <li key={i.code} className="py-3 flex items-center justify-between gap-4">
                <span className="font-mono tracking-[0.3em] text-white">{i.code}</span>
                <span className="font-mono text-[11px] tracking-widest text-ic-muted">
                  {i.used ? 'REDEEMED' : expired ? 'EXPIRED' : `EXPIRES ${new Date(i.expires_at ?? '').toLocaleDateString('en-GB')}`}
                </span>
                {!i.used && !expired && (
                  <button onClick={() => copy(i.code)} className="text-ic-muted hover:text-ic-gold" aria-label="Copy invite link"><Copy size={14} /></button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
