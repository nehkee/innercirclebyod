'use client';

import { useState } from 'react';
import {
  Users, Ticket, Package, CreditCard, BarChart2,
  Bell, Settings, LogOut, Plus, Check, X, Eye,
  TrendingUp, AlertCircle, Zap, Globe, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Mock data ──────────────────────────────────────────────────────────────────

const METRICS = [
  { label: 'TOTAL MEMBERS',   value: '12,400', delta: '+847',  icon: <Users size={18} />,   color: '#C9A84C' },
  { label: 'MONTHLY REVENUE', value: '₦4.2M',  delta: '+12%',  icon: <CreditCard size={18}/>,color: '#22c55e' },
  { label: 'ACTIVE EVENTS',   value: '3',      delta: '2 soon',icon: <Calendar size={18} />, color: '#3b82f6' },
  { label: 'OPEN APPS',       value: '67',     delta: 'pending',icon: <Bell size={18} />,    color: '#CC0000' },
];

const APPLICATIONS = [
  { id: 'a-001', name: 'WARLORD_ABUJA', email: 'w.abuja@gmail.com', type: 'STUDIO SESSION',    tier: 'WARLORD',  status: 'pending', msg: 'I\'ve been to 6 shows...',     time: '2h ago' },
  { id: 'a-002', name: 'NATIVESON',     email: 'native@me.com',     type: 'FAN HANGOUT',       tier: 'INSIDER',  status: 'pending', msg: 'OD changed my life in 2022.', time: '5h ago' },
  { id: 'a-003', name: 'UK_MACHINE',    email: 'uk@machine.co',     type: 'BACKSTAGE ACCESS',  tier: 'INSIDER',  status: 'approved',msg: 'Flying from London.',          time: '1d ago' },
  { id: 'a-004', name: 'CIRCUIT_KEMI',  email: 'kemi@circle.ng',    type: 'DINNER',            tier: 'WARLORD',  status: 'rejected',msg: 'Creative director here.',      time: '2d ago' },
];

const RECENT_TICKETS = [
  { id: 't-001', user: 'WARLORD_ABUJA', event: 'LISTENING PARTY — LAGOS', qty: 2, total: '₦230,000', time: '12m ago' },
  { id: 't-002', user: 'INSIDER_LONDON', event: 'UNDERGROUND SHOW — LONDON', qty: 1, total: '£95', time: '35m ago' },
  { id: 't-003', user: 'OD_STEPH',      event: 'LISTENING PARTY — LAGOS', qty: 1, total: '₦115,000', time: '1h ago' },
];

const TIER_BREAKDOWN = [
  { tier: 'MACHINE',  count: 7400, pct: 60, color: '#9CA3AF' },
  { tier: 'INSIDER',  count: 3720, pct: 30, color: '#C9A84C' },
  { tier: 'WARLORD',  count: 1110, pct: 9,  color: '#CC0000' },
  { tier: 'INDUSTRY', count: 170,  pct: 1,  color: '#FFFFFF' },
];

type AdminTab = 'overview' | 'applications' | 'events' | 'members' | 'drops';

const STATUS_STYLES: Record<string, string> = {
  pending:  'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
  approved: 'border-green-500/30 text-green-400 bg-green-500/10',
  rejected: 'border-red-500/30 text-red-400 bg-red-500/10',
};

export default function AdminPage() {
  const [tab,  setTab]  = useState<AdminTab>('overview');
  const [apps, setApps] = useState(APPLICATIONS);

  const updateApp = (id: string, status: 'approved' | 'rejected') => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success(status === 'approved' ? 'Application approved!' : 'Application rejected.');
  };

  return (
    <div className="bg-od-black min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 border-r border-od-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-od-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-od-gold flex items-center justify-center flex-shrink-0">
              <span className="font-bebas text-od-gold text-lg leading-none">OD</span>
            </div>
            <div className="hidden md:block">
              <p className="font-bebas text-[11px] tracking-[0.25em] text-od-gold">ADMIN</p>
              <p className="font-mono text-[8px] text-od-muted tracking-widest">INNER CIRCLE</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'overview',      label: 'Overview',     icon: <BarChart2 size={16} /> },
            { id: 'applications',  label: 'Applications', icon: <Bell size={16} />,       badge: apps.filter(a => a.status === 'pending').length },
            { id: 'events',        label: 'Events',       icon: <Calendar size={16} /> },
            { id: 'members',       label: 'Members',      icon: <Users size={16} /> },
            { id: 'drops',         label: 'Drops',        icon: <Package size={16} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left ${
                tab === item.id
                  ? 'bg-od-gold/10 text-od-gold border border-od-gold/30'
                  : 'text-od-muted hover:text-white hover:bg-od-gray'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden md:block font-mono text-xs tracking-widest">{item.label}</span>
              {item.badge ? (
                <span className="hidden md:block ml-auto bg-od-red text-white font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-od-border space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-od-muted hover:text-white transition-colors">
            <Settings size={16} />
            <span className="hidden md:block font-mono text-xs tracking-widest">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-od-muted hover:text-od-red transition-colors">
            <LogOut size={16} />
            <span className="hidden md:block font-mono text-xs tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <div className="border-b border-od-border px-6 py-4 flex items-center justify-between">
          <h1 className="font-bebas text-xl tracking-widest text-white">
            {tab.toUpperCase()}
          </h1>
          <div className="flex items-center gap-3">
            <span className="badge-live hidden md:flex">LIVE DASHBOARD</span>
            <button className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
              <Plus size={12} /> NEW EVENT
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {METRICS.map(m => (
                  <div key={m.label} className="border border-od-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ color: m.color }}>{m.icon}</span>
                      <span className="font-mono text-[9px] tracking-widest text-green-400">{m.delta}</span>
                    </div>
                    <p className="font-bebas text-3xl text-white">{m.value}</p>
                    <p className="font-mono text-[9px] tracking-widest text-od-muted mt-1">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tier breakdown */}
                <div className="border border-od-border p-6">
                  <p className="section-label mb-6">TIER BREAKDOWN</p>
                  <div className="space-y-4">
                    {TIER_BREAKDOWN.map(t => (
                      <div key={t.tier}>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span style={{ color: t.color }}>{t.tier}</span>
                          <span className="text-od-muted">{t.count.toLocaleString()} ({t.pct}%)</span>
                        </div>
                        <div className="h-2 bg-od-border rounded-none">
                          <div
                            className="h-2 transition-all duration-1000"
                            style={{ width: `${t.pct}%`, background: t.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sales */}
                <div className="border border-od-border p-6">
                  <p className="section-label mb-6">RECENT TICKET SALES</p>
                  <div className="space-y-4">
                    {RECENT_TICKETS.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-3 border-b border-od-border/30">
                        <div>
                          <p className="font-mono text-xs text-white">{t.user}</p>
                          <p className="font-mono text-[9px] text-od-muted">{t.event} × {t.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bebas text-lg text-od-gold">{t.total}</p>
                          <p className="font-mono text-[9px] text-od-muted">{t.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pending applications alert */}
              {apps.some(a => a.status === 'pending') && (
                <div className="border border-od-red/30 bg-od-red/5 p-5 flex items-center gap-4">
                  <AlertCircle size={18} className="text-od-red flex-shrink-0" />
                  <div>
                    <p className="font-bebas text-od-red text-lg">
                      {apps.filter(a => a.status === 'pending').length} APPLICATIONS PENDING REVIEW
                    </p>
                    <p className="font-mono text-[10px] text-od-muted mt-0.5">
                      Fan hangout, studio session, and backstage requests awaiting approval.
                    </p>
                  </div>
                  <button
                    onClick={() => setTab('applications')}
                    className="ml-auto font-mono text-xs text-od-red hover:text-white transition-colors whitespace-nowrap"
                  >
                    REVIEW →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── APPLICATIONS ─────────────────────────────────────────────── */}
          {tab === 'applications' && (
            <div className="space-y-4">
              {apps.map(app => (
                <div key={app.id} className="border border-od-border p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-mono text-sm text-white">{app.name}</p>
                        <span className={`font-mono text-[9px] tracking-widest px-2 py-0.5 border ${STATUS_STYLES[app.status]}`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-od-muted mb-2">{app.email} · {app.tier} · {app.time}</p>
                      <p className="font-mono text-[10px] text-od-gold mb-3">APPLICATION: {app.type}</p>
                      <p className="text-od-muted text-sm italic">"{app.msg}"</p>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateApp(app.id, 'approved')}
                          className="flex items-center gap-1 border border-green-500/30 text-green-400 hover:bg-green-500/10 px-4 py-2 font-mono text-xs tracking-widest transition-all"
                        >
                          <Check size={12} /> APPROVE
                        </button>
                        <button
                          onClick={() => updateApp(app.id, 'rejected')}
                          className="flex items-center gap-1 border border-od-red/30 text-od-red hover:bg-od-red/10 px-4 py-2 font-mono text-xs tracking-widest transition-all"
                        >
                          <X size={12} /> REJECT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── EVENTS ───────────────────────────────────────────────────── */}
          {tab === 'events' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-od-muted font-mono text-xs tracking-widest">3 ACTIVE EVENTS</p>
                <button className="btn-primary py-2 px-6 text-xs flex items-center gap-1">
                  <Plus size={12} /> CREATE EVENT
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'WARLORD SEASON LISTENING PARTY', date: '2026-06-14', sold: 127, cap: 150, rev: '₦14.6M' },
                  { title: 'UNDERGROUND SHOW — LONDON',       date: '2026-07-05', sold: 241, cap: 300, rev: '£22.9K' },
                  { title: 'INDUSTRY MACHINE HANGOUT — ABUJA',date: '2026-07-19', sold: 18,  cap: 20,  rev: 'FREE'   },
                ].map(ev => (
                  <div key={ev.title} className="border border-od-border p-6 flex items-center gap-6">
                    <div className="flex-1">
                      <p className="font-bebas text-xl text-white">{ev.title}</p>
                      <p className="font-mono text-[10px] text-od-muted">{ev.date}</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="font-bebas text-2xl text-od-gold">{ev.sold}/{ev.cap}</p>
                      <p className="font-mono text-[9px] text-od-muted">SOLD</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="font-bebas text-xl text-white">{ev.rev}</p>
                      <p className="font-mono text-[9px] text-od-muted">REVENUE</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="border border-od-border text-od-muted hover:text-white p-2 transition-colors">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MEMBERS ──────────────────────────────────────────────────── */}
          {tab === 'members' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-od-muted font-mono text-xs tracking-widest">12,400 TOTAL MEMBERS</p>
                <input
                  type="search"
                  placeholder="SEARCH MEMBERS..."
                  className="bg-od-dark border border-od-border text-white px-4 py-2 font-mono text-xs focus:border-od-gold focus:outline-none w-48 placeholder:text-od-muted tracking-widest"
                />
              </div>
              <div className="border border-od-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-od-border">
                      {['MEMBER', 'TIER', 'JOINED', 'EVENTS', 'TOTAL SPENT', ''].map(h => (
                        <th key={h} className="text-left py-4 px-6 font-mono text-[9px] tracking-widest text-od-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'WARLORD_ABUJA',  tier: 'INDUSTRY', joined: 'Jan 2024', events: 18, spent: '₦2.4M'  },
                      { name: 'MACHINE_ADEOLU', tier: 'WARLORD',  joined: 'Feb 2024', events: 14, spent: '₦890K'  },
                      { name: 'INSIDER_LONDON', tier: 'WARLORD',  joined: 'Mar 2024', events: 11, spent: '£1.2K'  },
                      { name: 'OD_STEPH',       tier: 'INSIDER',  joined: 'Apr 2024', events: 9,  spent: '$240'   },
                      { name: 'CIRCUIT_KEMI',   tier: 'INSIDER',  joined: 'Jan 2024', events: 12, spent: '₦340K'  },
                    ].map(m => (
                      <tr key={m.name} className="border-b border-od-border/30 hover:bg-od-gray/20">
                        <td className="py-4 px-6 font-mono text-sm text-white">{m.name}</td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-[9px] tracking-widest px-2 py-0.5 border border-od-gold/20 text-od-gold">{m.tier}</span>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-od-muted">{m.joined}</td>
                        <td className="py-4 px-6 font-mono text-xs text-white">{m.events}</td>
                        <td className="py-4 px-6 font-bebas text-lg text-od-gold">{m.spent}</td>
                        <td className="py-4 px-6">
                          <button className="font-mono text-[9px] text-od-muted hover:text-white transition-colors tracking-widest">
                            VIEW →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DROPS ────────────────────────────────────────────────────── */}
          {tab === 'drops' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-od-muted font-mono text-xs tracking-widest">5 DROPS</p>
                <button className="btn-primary py-2 px-6 text-xs flex items-center gap-1">
                  <Plus size={12} /> CREATE DROP
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'INDUSTRY MACHINE TEE — VOL. 1', sold: 174, qty: 200, rev: '₦7.8M',  status: 'live'    },
                  { name: 'WARLORD SEASON — UNRELEASED EP', sold: 312, qty: 500, rev: '₦2.5M',  status: 'live'    },
                  { name: '[CLASSIFIED] — RESTRICTED DROP',  sold: 0,   qty: 50,  rev: '—',      status: 'locked'  },
                  { name: 'INNER CIRCLE HOODIE — BLACK',     sold: 289, qty: 300, rev: '₦18.8M', status: 'ending'  },
                ].map(drop => (
                  <div key={drop.name} className="border border-od-border p-6 flex items-center gap-6">
                    <div className="flex-1">
                      <p className="font-bebas text-xl text-white">{drop.name}</p>
                      <div className="mt-2 w-48 h-px bg-od-border">
                        <div
                          className="h-px bg-od-gold"
                          style={{ width: `${(drop.sold / drop.qty) * 100}%` }}
                        />
                      </div>
                      <p className="font-mono text-[9px] text-od-muted mt-1">{drop.sold}/{drop.qty} SOLD</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bebas text-xl text-od-gold">{drop.rev}</p>
                      <p className="font-mono text-[9px] text-od-muted">REVENUE</p>
                    </div>
                    <div>
                      <span className={`font-mono text-[9px] tracking-widest px-3 py-1 border ${
                        drop.status === 'live'   ? 'border-green-500/30 text-green-400' :
                        drop.status === 'locked' ? 'border-od-red/30 text-od-red' :
                        'border-yellow-500/30 text-yellow-400'
                      }`}>
                        {drop.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
