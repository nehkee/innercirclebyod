'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';

type State = 'idle' | 'checking' | 'valid' | 'redeeming' | 'done' | 'needs_account';

/** Enter an invite code: validate it, then redeem it to the signed-in account. */
export function InviteRedeem({ authEnabled }: { authEnabled: boolean }) {
  const params = useSearchParams();
  const [code, setCode]   = useState((params.get('code') ?? '').toUpperCase());
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function check(c = code) {
    const clean = c.trim().toUpperCase();
    if (!clean) return;
    setState('checking'); setError(null);
    const res = await fetch(`/api/invites?code=${encodeURIComponent(clean)}`);
    const body = await res.json().catch(() => ({}));
    if (!body.valid) { setState('idle'); setError(body.reason ?? 'That code isn’t valid'); return; }
    setState('valid');
    await redeem(clean);
  }

  async function redeem(clean: string) {
    setState('redeeming');
    const res = await fetch('/api/invites', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: clean }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) { setState('needs_account'); return; }
    if (!res.ok) { setState('idle'); setError(body.error ?? 'Could not redeem'); return; }
    setState('done');
  }

  // Arriving from an invite link: check straight away
  useEffect(() => { if (code) check(code); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const redirect = encodeURIComponent(`/invite?code=${code.trim().toUpperCase()}`);

  if (state === 'done') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 border border-ic-gold/40 text-ic-gold flex items-center justify-center"><Check size={28} /></div>
        <p className="font-bebas text-5xl text-white mb-3">YOU&apos;RE IN</p>
        <p className="text-ic-silver mb-8">Your seat is unlocked. Choose your tier to complete your entry.</p>
        <Link href="/membership" className="btn-primary px-10 py-3 text-sm">CHOOSE YOUR TIER</Link>
      </div>
    );
  }

  if (state === 'needs_account') {
    return (
      <div className="text-center">
        <p className="font-bebas text-4xl text-white mb-3">YOUR CODE IS VALID</p>
        <p className="text-ic-silver mb-8">Create your account (or sign in) and we&apos;ll attach the invite to it.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/sign-up?redirect_url=${redirect}`} className="btn-primary px-8 py-3 text-sm">CREATE ACCOUNT</Link>
          <Link href={`/sign-in?redirect_url=${redirect}`} className="btn-secondary px-8 py-3 text-sm">SIGN IN</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={e => { e.preventDefault(); check(); }} className="max-w-md mx-auto">
      <label htmlFor="code" className="section-label block mb-3">INVITE CODE</label>
      <div className="flex gap-2">
        <input
          id="code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="E.G. 7F3A91C2"
          maxLength={32}
          autoComplete="off"
          className="flex-1 bg-ic-black border border-ic-border text-white font-mono tracking-[0.3em] text-lg px-4 py-3 focus:outline-none focus:border-ic-gold uppercase"
        />
        <button disabled={!code.trim() || state !== 'idle'} className="btn-primary px-6 text-sm flex items-center gap-2">
          {state !== 'idle' && <Loader2 size={14} className="animate-spin" />} ENTER
        </button>
      </div>
      {error && <p className="font-mono text-[11px] tracking-widest text-ic-red mt-3">{error.toUpperCase()}</p>}
      <p className="text-ic-muted text-sm mt-8">
        No code? <Link href="/join" className="text-ic-gold hover:underline">Join the waitlist</Link>. Seats open by invitation from members and the team.
      </p>
    </form>
  );
}
