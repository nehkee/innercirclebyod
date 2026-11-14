'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Pencil, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { EventPoster } from '@/components/art/EventPoster';

interface EventRow {
  id: string; title: string; type: string; date: string; location: string; venue: string | null;
  description: string | null; price_usd: number; price_ngn: number; capacity: number; sold: number;
  is_vip: boolean; is_secret: boolean; is_active: boolean; min_tier: string | null; image_url: string | null;
}

const TYPES = [
  ['listening_party', 'Listening party'], ['show', 'Underground show'], ['hangout', 'Hangout'],
  ['studio', 'Studio session'], ['industry', 'Industry event'], ['secret', 'Secret event'],
] as const;
const TIERS = ['', 'initiate', 'insider', 'vanguard', 'sovereign'];

const EMPTY = {
  title: '', type: 'listening_party', date: '', location: '', venue: '', description: '',
  priceUSD: 0, priceNGN: 0, capacity: 100, isVip: false, isSecret: false, isActive: false, minTier: '', imageUrl: '',
};
type Form = typeof EMPTY;

/** Local datetime-input value <-> ISO string */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** Create, edit and publish events without touching the database. */
export function AdminEvents() {
  const [events, setEvents]   = useState<EventRow[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/events', { cache: 'no-store' });
    if (!res.ok) { setError('The event editor needs Clerk sign-in, an admin account and Supabase.'); return; }
    setError(null);
    setEvents((await res.json()).events);
  }, []);
  useEffect(() => { load(); }, [load]);

  function edit(e?: EventRow) {
    setEditing(e ? {
      id: e.id,
      form: {
        title: e.title, type: e.type, date: toLocalInput(e.date), location: e.location, venue: e.venue ?? '',
        description: e.description ?? '', priceUSD: Number(e.price_usd), priceNGN: Number(e.price_ngn),
        capacity: e.capacity, isVip: e.is_vip, isSecret: e.is_secret, isActive: e.is_active,
        minTier: e.min_tier ?? '', imageUrl: e.image_url ?? '',
      },
    } : { id: null, form: { ...EMPTY } });
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return;
    const f = editing.form;
    if (!f.date) { toast.error('Pick a date and time'); return; }
    setSaving(true);
    try {
      const payload = {
        ...f,
        date:     new Date(f.date).toISOString(),
        venue:    f.venue || null,
        minTier:  f.minTier || null,
        imageUrl: f.imageUrl || null,
      };
      const res = await fetch(editing.id ? `/api/admin/events/${editing.id}` : '/api/events', {
        method:  editing.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof body.error === 'string' ? body.error : 'Check the fields and try again');
        return;
      }
      toast.success(editing.id ? 'Event updated' : 'Event created');
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(e: EventRow) {
    const res = await fetch(`/api/admin/events/${e.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !e.is_active }),
    });
    if (res.ok) { toast.success(e.is_active ? 'Unpublished' : 'Published — live on the site'); load(); }
    else toast.error('Could not update');
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setEditing(cur => cur && { ...cur, form: { ...cur.form, [k]: v } });

  if (error) return <p className="font-mono text-xs tracking-widest text-ic-muted py-6">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-ic-muted font-mono text-xs tracking-widest">
          {events.filter(e => e.is_active).length} LIVE · {events.filter(e => !e.is_active).length} DRAFT
        </p>
        <button onClick={() => edit()} className="btn-primary py-2 px-6 text-xs flex items-center gap-1">
          <Plus size={12} /> CREATE EVENT
        </button>
      </div>

      {events.length === 0 && <p className="font-mono text-[11px] tracking-widest text-ic-muted">NO EVENTS YET. CREATE THE FIRST ONE.</p>}

      <div className="space-y-3">
        {events.map(e => {
          const past = new Date(e.date) < new Date();
          return (
            <div key={e.id} className="border border-ic-border p-4 flex items-center gap-4">
              <div className="w-16 h-20 flex-shrink-0 hidden sm:block">
                <EventPoster title={e.title} type={e.type} date={e.date} location={e.location} imageUrl={e.image_url} compact />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-[10px] tracking-widest border px-1.5 py-0.5 ${
                    past ? 'text-ic-muted border-ic-border' : e.is_active ? 'text-green-400 border-green-500/40' : 'text-ic-gold border-ic-gold/40'}`}>
                    {past ? 'PAST' : e.is_active ? 'LIVE' : 'DRAFT'}
                  </span>
                  {e.min_tier && <span className="font-mono text-[10px] tracking-widest text-ic-muted">{e.min_tier.toUpperCase()}+</span>}
                </div>
                <p className="font-bebas text-xl text-white truncate">{e.title}</p>
                <p className="font-mono text-[11px] text-ic-muted">{new Date(e.date).toLocaleString('en-GB')} · {e.location}</p>
              </div>
              <div className="text-center hidden md:block">
                <p className="font-bebas text-2xl text-ic-gold">{e.sold}/{e.capacity}</p>
                <p className="font-mono text-[10px] text-ic-muted">SOLD</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => togglePublish(e)} title={e.is_active ? 'Unpublish' : 'Publish'}
                  className="border border-ic-border text-ic-muted hover:text-white p-2">
                  {e.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => edit(e)} title="Edit" className="border border-ic-border text-ic-muted hover:text-white p-2">
                  <Pencil size={14} />
                </button>
                {e.is_active && (
                  <Link href={`/events/${e.id}`} target="_blank" className="border border-ic-border text-ic-muted hover:text-white p-2 font-mono text-[10px]">
                    VIEW
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="w-full max-w-2xl bg-ic-dark border border-ic-border p-6 my-8 space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-bebas text-3xl text-white">{editing.id ? 'EDIT EVENT' : 'NEW EVENT'}</p>
              <button type="button" onClick={() => setEditing(null)} className="text-ic-muted hover:text-white" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="grid sm:grid-cols-[1fr_140px] gap-4">
              <div className="space-y-4">
                <Field label="Title"><input required maxLength={200} value={editing.form.title} onChange={e => set('title', e.target.value)} className={input} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Type">
                    <select value={editing.form.type} onChange={e => set('type', e.target.value)} className={input}>
                      {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Date & time"><input type="datetime-local" required value={editing.form.date} onChange={e => set('date', e.target.value)} className={input} /></Field>
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="section-label mb-2">POSTER</p>
                <EventPoster title={editing.form.title || 'UNTITLED'} type={editing.form.type} date={editing.form.date || new Date().toISOString()}
                  location={editing.form.location || 'TBA'} imageUrl={editing.form.imageUrl || null} compact />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="City, country"><input required value={editing.form.location} onChange={e => set('location', e.target.value)} placeholder="Lagos, Nigeria" className={input} /></Field>
              <Field label="Venue (optional)"><input value={editing.form.venue} onChange={e => set('venue', e.target.value)} placeholder="Secret location" className={input} /></Field>
            </div>
            <Field label="Description"><textarea required rows={3} maxLength={2000} value={editing.form.description} onChange={e => set('description', e.target.value)} className={input} /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Price USD"><input type="number" min={0} step="0.01" value={editing.form.priceUSD} onChange={e => set('priceUSD', Number(e.target.value))} className={input} /></Field>
              <Field label="Price NGN"><input type="number" min={0} step="1" value={editing.form.priceNGN} onChange={e => set('priceNGN', Number(e.target.value))} className={input} /></Field>
              <Field label="Capacity"><input type="number" min={1} value={editing.form.capacity} onChange={e => set('capacity', Number(e.target.value))} className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Minimum tier">
                <select value={editing.form.minTier} onChange={e => set('minTier', e.target.value)} className={input}>
                  {TIERS.map(t => <option key={t} value={t}>{t ? t.toUpperCase() + '+' : 'Open to all members'}</option>)}
                </select>
              </Field>
              <Field label="Photo URL (optional — poster art is generated if empty)">
                <input type="url" value={editing.form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" className={input} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6 font-mono text-[11px] tracking-widest text-ic-silver">
              <Check label="VIP" checked={editing.form.isVip} onChange={v => set('isVip', v)} />
              <Check label="SECRET LOCATION" checked={editing.form.isSecret} onChange={v => set('isSecret', v)} />
              <Check label="PUBLISHED (LIVE ON SITE)" checked={editing.form.isActive} onChange={v => set('isActive', v)} />
            </div>
            <p className="font-mono text-[10px] tracking-widest text-ic-muted">SET BOTH PRICES TO 0 FOR A FREE MEMBERS EVENT.</p>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-sm flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} {editing.id ? 'SAVE CHANGES' : 'CREATE EVENT'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="border border-ic-border text-ic-muted px-6 font-mono text-[11px] tracking-widest">CANCEL</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const input = 'w-full bg-ic-black border border-ic-border text-white text-sm px-3 py-2 focus:outline-none focus:border-ic-gold';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="section-label block mb-2">{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-[#C9A84C] w-4 h-4" />
      {label}
    </label>
  );
}
