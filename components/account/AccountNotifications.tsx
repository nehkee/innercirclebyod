'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Loader2 } from 'lucide-react';

/** WhatsApp opt-in: drops, reminders and tickets, straight to the member's phone. */
export function AccountNotifications() {
  const [loaded, setLoaded]       = useState(false);
  const [available, setAvailable] = useState(false);
  const [phone, setPhone]         = useState('');
  const [optIn, setOptIn]         = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    fetch('/api/account/notifications', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) { setAvailable(d.available); setPhone(d.phone); setOptIn(d.optIn); } setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  async function save(nextOptIn = optIn) {
    setSaving(true);
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, optIn: nextOptIn }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.error ?? 'Could not save'); return; }
      setOptIn(nextOptIn);
      if (body.phone) setPhone(body.phone);
      toast.success(nextOptIn ? "WhatsApp updates on. We'll only message you about drops, tickets and events." : 'WhatsApp updates off');
    } finally { setSaving(false); }
  }

  if (!loaded || !available) return null;

  return (
    <section className="lg:col-span-3 border border-ic-border p-6 md:p-8">
      <p className="section-label mb-2 flex items-center gap-2"><MessageSquare size={12} /> WHATSAPP UPDATES</p>
      <p className="text-ic-muted text-sm mb-5">Drop alerts the moment they go live, your ticket, and a reminder the day before. Nothing else. Turn it off any time.</p>
      <form onSubmit={e => { e.preventDefault(); save(true); }} className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+234 801 234 5678"
          aria-label="WhatsApp number"
          className="flex-1 bg-ic-black border border-ic-border text-white px-3 py-2 focus:outline-none focus:border-ic-gold"
        />
        {optIn ? (
          <button type="button" onClick={() => save(false)} disabled={saving}
            className="border border-ic-border text-ic-muted hover:text-white px-5 py-2 font-mono text-[11px] tracking-widest">
            TURN OFF
          </button>
        ) : (
          <button type="submit" disabled={saving || !phone.trim()} className="btn-primary px-6 py-2 text-xs flex items-center gap-2">
            {saving && <Loader2 size={12} className="animate-spin" />} TURN ON
          </button>
        )}
      </form>
      {optIn && <p className="font-mono text-[11px] tracking-widest text-green-400 mt-3">ON · {phone}</p>}
    </section>
  );
}
