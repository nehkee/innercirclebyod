'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Eye, EyeOff, Trophy, X, Lock } from 'lucide-react';

interface DropRow {
  id: string; name: string; type: string; price_usd: number; price_ngn: number; quantity: number; sold: number;
  drop_date: string; min_tier: string | null; is_password_protected: boolean; is_secret: boolean; is_active: boolean;
}
interface RaffleRow {
  id: string; title: string; prize_description: string; status: string; closes_at: string | null;
  entries: number; members: { username: string | null } | null;
}

const input = 'w-full bg-ic-black border border-ic-border text-white text-sm px-3 py-2 focus:outline-none focus:border-ic-gold';
const iso = (local: string) => (local ? new Date(local).toISOString() : null);

/** Create drops and raffles, publish them, and draw raffle winners. */
export function AdminDrops() {
  const [drops, setDrops]     = useState<DropRow[]>([]);
  const [raffles, setRaffles] = useState<RaffleRow[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [form, setForm]       = useState<null | 'drop' | 'raffle'>(null);
  const [busy, setBusy]       = useState(false);

  const load = useCallback(async () => {
    const [d, r] = await Promise.all([fetch('/api/admin/drops', { cache: 'no-store' }), fetch('/api/admin/raffles', { cache: 'no-store' })]);
    if (!d.ok || !r.ok) { setError('Drops and raffles need Clerk sign-in, an admin account and Supabase.'); return; }
    setError(null);
    setDrops((await d.json()).drops);
    setRaffles((await r.json()).raffles);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(url: string, payload: unknown, done: string) {
    setBusy(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(typeof body.error === 'string' ? body.error : 'Check the fields'); return; }
      toast.success(done); setForm(null); load();
    } finally { setBusy(false); }
  }

  async function createDrop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await submit('/api/admin/drops', {
      name: f.get('name'), type: f.get('type'), description: f.get('description') || null,
      priceUSD: Number(f.get('priceUSD')), priceNGN: Number(f.get('priceNGN')), quantity: Number(f.get('quantity')),
      dropDate: iso(String(f.get('dropDate'))), endsAt: iso(String(f.get('endsAt') ?? '')),
      minTier: f.get('minTier') || null, isSecret: f.get('isSecret') === 'on', isActive: f.get('isActive') === 'on',
      password: String(f.get('password') ?? '') || undefined, imageUrl: f.get('imageUrl') || null,
    }, 'Drop created');
  }

  async function createRaffle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await submit('/api/admin/raffles', {
      title: f.get('title'), prizeDescription: f.get('prize'), description: f.get('description') || null,
      minTier: f.get('minTier') || null, closesAt: iso(String(f.get('closesAt'))), entriesPerVanguard: Number(f.get('bonus') || 2),
    }, 'Raffle opened');
  }

  async function toggleDrop(d: DropRow) {
    const res = await fetch(`/api/admin/drops/${d.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !d.is_active }),
    });
    if (res.ok) { toast.success(d.is_active ? 'Hidden' : 'Published'); load(); } else toast.error('Could not update');
  }

  async function draw(r: RaffleRow) {
    if (!window.confirm(`Draw a winner for "${r.title}" now? All ${r.entries} entries will be emailed the result.`)) return;
    const res = await fetch('/api/raffles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ raffleId: r.id }) });
    const body = await res.json().catch(() => ({}));
    if (res.ok) { toast.success(`Winner: ${body.winner?.username ?? 'drawn'}`); load(); } else toast.error(body.error ?? 'Draw failed');
  }

  if (error) return <p className="font-mono text-xs tracking-widest text-ic-muted py-6">{error}</p>;

  return (
    <div className="space-y-12">
      {/* Drops */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <p className="section-label">DROPS · {drops.filter(d => d.is_active).length} LIVE</p>
          <button onClick={() => setForm('drop')} className="btn-primary py-2 px-5 text-xs flex items-center gap-1"><Plus size={12} /> NEW DROP</button>
        </div>
        {drops.length === 0 && <p className="font-mono text-[11px] tracking-widest text-ic-muted">NO DROPS YET.</p>}
        <div className="space-y-3">
          {drops.map(d => (
            <div key={d.id} className="border border-ic-border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bebas text-xl text-white truncate flex items-center gap-2">
                  {d.is_password_protected && <Lock size={14} className="text-ic-red" />}{d.name}
                </p>
                <p className="font-mono text-[11px] text-ic-muted">
                  {d.type.toUpperCase()} · {new Date(d.drop_date).toLocaleString('en-GB')}{d.min_tier ? ` · ${d.min_tier.toUpperCase()}+` : ''}
                </p>
              </div>
              <p className="font-bebas text-2xl text-ic-gold">{d.sold}/{d.quantity}</p>
              <button onClick={() => toggleDrop(d)} className="border border-ic-border text-ic-muted hover:text-white p-2" title={d.is_active ? 'Hide' : 'Publish'}>
                {d.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Raffles */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <p className="section-label">RAFFLES · FREE ENTRY FOR ELIGIBLE MEMBERS</p>
          <button onClick={() => setForm('raffle')} className="btn-primary py-2 px-5 text-xs flex items-center gap-1"><Plus size={12} /> NEW RAFFLE</button>
        </div>
        {raffles.length === 0 && <p className="font-mono text-[11px] tracking-widest text-ic-muted">NO RAFFLES YET.</p>}
        <div className="space-y-3">
          {raffles.map(r => (
            <div key={r.id} className="border border-ic-border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bebas text-xl text-white truncate">{r.title}</p>
                <p className="font-mono text-[11px] text-ic-muted truncate">{r.prize_description}</p>
              </div>
              <p className="font-mono text-[11px] text-ic-muted">{r.entries} ENTRIES</p>
              {r.status === 'drawn' ? (
                <span className="font-mono text-[11px] tracking-widest text-ic-gold flex items-center gap-1"><Trophy size={12} /> {r.members?.username ?? 'DRAWN'}</span>
              ) : (
                <button onClick={() => draw(r)} disabled={r.entries === 0}
                  className="border border-ic-gold text-ic-gold hover:bg-ic-gold/10 font-mono text-[11px] tracking-widest px-3 py-2 disabled:opacity-40">
                  DRAW WINNER
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {form && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true">
          <form onSubmit={form === 'drop' ? createDrop : createRaffle} className="w-full max-w-xl bg-ic-dark border border-ic-border p-6 my-8 space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-bebas text-3xl text-white">{form === 'drop' ? 'NEW DROP' : 'NEW RAFFLE'}</p>
              <button type="button" onClick={() => setForm(null)} className="text-ic-muted hover:text-white" aria-label="Close"><X size={18} /></button>
            </div>
            {form === 'drop' ? (
              <>
                <L t="Name"><input name="name" required maxLength={200} className={input} /></L>
                <div className="grid grid-cols-2 gap-4">
                  <L t="Type"><select name="type" className={input}><option value="merch">Merch</option><option value="music">Music</option><option value="ticket">Access</option><option value="invite">Invitation</option></select></L>
                  <L t="Quantity"><input name="quantity" type="number" min={1} defaultValue={100} className={input} /></L>
                </div>
                <L t="Description"><textarea name="description" rows={2} maxLength={2000} className={input} /></L>
                <div className="grid grid-cols-2 gap-4">
                  <L t="Price USD"><input name="priceUSD" type="number" min={0} step="0.01" defaultValue={0} className={input} /></L>
                  <L t="Price NGN"><input name="priceNGN" type="number" min={0} defaultValue={0} className={input} /></L>
                  <L t="Goes live"><input name="dropDate" type="datetime-local" required className={input} /></L>
                  <L t="Ends (optional)"><input name="endsAt" type="datetime-local" className={input} /></L>
                  <L t="Minimum tier"><select name="minTier" className={input}><option value="">All members</option><option value="initiate">INITIATE+</option><option value="insider">INSIDER+</option><option value="vanguard">VANGUARD+</option><option value="sovereign">SOVEREIGN</option></select></L>
                  <L t="Password (optional)"><input name="password" maxLength={100} className={input} /></L>
                </div>
                <L t="Photo URL (optional)"><input name="imageUrl" type="url" className={input} /></L>
                <div className="flex gap-6 font-mono text-[11px] tracking-widest text-ic-silver">
                  <label className="flex items-center gap-2"><input type="checkbox" name="isSecret" className="accent-[#C9A84C]" /> SECRET (HIDDEN UNTIL UNLOCKED)</label>
                  <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked className="accent-[#C9A84C]" /> PUBLISHED</label>
                </div>
              </>
            ) : (
              <>
                <L t="Title"><input name="title" required maxLength={200} className={input} /></L>
                <L t="Prize"><input name="prize" required maxLength={500} className={input} /></L>
                <L t="Details (optional)"><textarea name="description" rows={2} className={input} /></L>
                <div className="grid grid-cols-3 gap-4">
                  <L t="Closes"><input name="closesAt" type="datetime-local" required className={input} /></L>
                  <L t="Minimum tier"><select name="minTier" className={input}><option value="">All members</option><option value="insider">INSIDER+</option><option value="vanguard">VANGUARD+</option><option value="sovereign">SOVEREIGN</option></select></L>
                  <L t="Vanguard+ entries"><input name="bonus" type="number" min={1} max={10} defaultValue={2} className={input} /></L>
                </div>
              </>
            )}
            <button type="submit" disabled={busy} className="btn-primary px-8 py-3 text-sm">{form === 'drop' ? 'CREATE DROP' : 'OPEN RAFFLE'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="section-label block mb-2">{t}</span>{children}</label>;
}
