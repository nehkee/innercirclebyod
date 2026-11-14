'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import {
  Users, Ticket, Package, BarChart2, Bell, LogOut, Check, X, MessageCircle, RotateCcw,
  AlertCircle, Calendar, RefreshCw, Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthEnabled } from '@/components/providers/Providers';
import { AdminInbox } from '@/components/admin/AdminInbox';
import { AdminRefunds } from '@/components/admin/AdminRefunds';

// ─── API shapes (see app/api/admin/analytics and app/api/applications) ─────────

interface Analytics {
  overview:      { totalMembers: number; newMembers: number; activeTickets: number; pendingApps: number };
  tierBreakdown: Record<string, number>;
  events:        { id: string; title: string; capacity: number; sold: number; date: string }[];
  recentTickets: { id: string; created_at: string; events: { title: string } | null; members: { username: string | null } | null }[];
  topMembers:    { id: string; username: string | null; tier: string; points: number }[];
  paymentSplit:  Record<string, number>;
  range:         string;
}

interface Application {
  id:         string;
  type:       string;
  user_name:  string;
  user_email: string;
  message:    string;
  status:     'pending' | 'approved' | 'rejected';
  created_at: string;
  members:    { username: string | null; tier: string } | null;
}

type AdminTab = 'overview' | 'inbox' | 'refunds' | 'applications' | 'events' | 'members' | 'drops';
type Range    = '7d' | '30d' | '90d';

const TIERS = [
  { id: 'initiate', label: 'INITIATE', color: '#9CA3AF' },
  { id: 'insider',  label: 'INSIDER',  color: '#C9A84C' },
  { id: 'vanguard', label: 'VANGUARD', color: '#CC0000' },
  { id: 'sovereign', label: 'SOVEREIGN', color: '#FFFFFF' },
];

const STATUS_STYLES: Record<string, string> = {
  pending:  'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
  approved: 'border-green-500/30 text-green-400 bg-green-500/10',
  rejected: 'border-red-500/30 text-red-400 bg-red-500/10',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60)   return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs tracking-widest text-ic-muted py-6">{children}</p>;
}

export default function AdminPage() {
  const authEnabled = useAuthEnabled();
  const [tab,   setTab]   = useState<AdminTab>('overview');
  const [inboxThread, setInboxThread] = useState<string | null>(null);

  // Team notification emails link to /admin?thread=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('thread');
    if (id) { setInboxThread(id); setTab('inbox'); }
  }, []);
  const [range, setRange] = useState<Range>('30d');
  const [data,  setData]  = useState<Analytics | null>(null);
  const [apps,  setApps]  = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/admin/analytics?range=${range}`),
        fetch('/api/applications'),
      ]);
      if (!a.ok) {
        setError(a.status === 401 || a.status === 403
          ? 'Live data needs Clerk sign-in and an admin account (members.is_admin = true).'
          : 'Could not load analytics. Check the Supabase connection.');
        setData(null);
        setApps([]);
        return;
      }
      setData(await a.json());
      setApps(b.ok ? (await b.json()).applications ?? [] : []);
    } catch {
      setError('Network error while loading the dashboard.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const updateApp = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/applications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      toast.error('Could not update the application.');
      return;
    }
    setApps(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
    toast.success(status === 'approved' ? 'Application approved.' : 'Application rejected.');
  };

  const pendingCount = apps.filter(a => a.status === 'pending').length;
  const totalTiered  = data ? Object.values(data.tierBreakdown).reduce((s, n) => s + n, 0) : 0;

  const metrics = data
    ? [
        { label: 'TOTAL MEMBERS',    value: data.overview.totalMembers.toLocaleString(), delta: `+${data.overview.newMembers} in ${range}`, icon: <Users size={18} />,    color: '#C9A84C' },
        { label: 'TICKETS SOLD',     value: data.overview.activeTickets.toLocaleString(), delta: `last ${range}`,                         icon: <Ticket size={18} />,   color: '#22c55e' },
        { label: 'UPCOMING EVENTS',  value: String(data.events.filter(e => new Date(e.date) > new Date()).length), delta: 'active', icon: <Calendar size={18} />, color: '#3b82f6' },
        { label: 'OPEN APPLICATIONS', value: String(pendingCount),                         delta: 'pending',                               icon: <Bell size={18} />,     color: '#CC0000' },
      ]
    : [];

  return (
    <div className="bg-ic-black min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 border-r border-ic-border flex flex-col flex-shrink-0">
        <div className="p-4 md:p-6 border-b border-ic-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-ic-gold flex items-center justify-center flex-shrink-0">
              <span className="font-bebas text-ic-gold text-lg leading-none">IC</span>
            </div>
            <div className="hidden md:block">
              <p className="font-bebas text-[11px] tracking-[0.25em] text-ic-gold">ADMIN</p>
              <p className="font-mono text-[8px] text-ic-muted tracking-widest">INNER CIRCLE</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'overview',     label: 'Overview',     icon: <BarChart2 size={16} /> },
            { id: 'inbox',        label: 'Inbox',        icon: <MessageCircle size={16} /> },
            { id: 'refunds',      label: 'Refunds',      icon: <RotateCcw size={16} /> },
            { id: 'applications', label: 'Applications', icon: <Bell size={16} />, badge: pendingCount },
            { id: 'events',       label: 'Events',       icon: <Calendar size={16} /> },
            { id: 'members',      label: 'Members',      icon: <Users size={16} /> },
            { id: 'drops',        label: 'Drops',        icon: <Package size={16} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left ${
                tab === item.id
                  ? 'bg-ic-gold/10 text-ic-gold border border-ic-gold/30'
                  : 'text-ic-muted hover:text-white hover:bg-ic-gray'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden md:block font-mono text-xs tracking-widest">{item.label}</span>
              {item.badge ? (
                <span className="hidden md:flex ml-auto bg-ic-red text-white font-mono text-[9px] w-5 h-5 rounded-full items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-ic-border space-y-1">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 text-ic-muted hover:text-white transition-colors">
            <Home size={16} />
            <span className="hidden md:block font-mono text-xs tracking-widest">View site</span>
          </Link>
          {authEnabled && (
            <SignOutButton redirectUrl="/">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-ic-muted hover:text-ic-red transition-colors">
                <LogOut size={16} />
                <span className="hidden md:block font-mono text-xs tracking-widest">Sign Out</span>
              </button>
            </SignOutButton>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="border-b border-ic-border px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="font-bebas text-xl tracking-widest text-white">{tab.toUpperCase()}</h1>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`font-mono text-[10px] tracking-widest px-3 py-1.5 border transition-colors ${
                  range === r ? 'border-ic-gold text-ic-gold' : 'border-ic-border text-ic-muted hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
            <button
              onClick={load}
              className="border border-ic-border text-ic-muted hover:text-white p-1.5 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="border border-ic-red/30 bg-ic-red/5 p-4 flex items-start gap-3 mb-8">
              <AlertCircle size={16} className="text-ic-red flex-shrink-0 mt-0.5" />
              <p className="font-mono text-xs text-ic-silver tracking-wide">{error}</p>
            </div>
          )}

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab === 'overview' && data && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(m => (
                  <div key={m.label} className="border border-ic-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ color: m.color }}>{m.icon}</span>
                      <span className="font-mono text-[9px] tracking-widest text-ic-muted">{m.delta}</span>
                    </div>
                    <p className="font-bebas text-3xl text-white">{m.value}</p>
                    <p className="font-mono text-[9px] tracking-widest text-ic-muted mt-1">{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-ic-border p-6">
                  <p className="section-label mb-6">TIER BREAKDOWN</p>
                  {totalTiered === 0 ? <Empty>NO MEMBERS YET</Empty> : (
                    <div className="space-y-4">
                      {TIERS.map(t => {
                        const count = data.tierBreakdown[t.id] ?? 0;
                        const pct   = Math.round((count / totalTiered) * 100);
                        return (
                          <div key={t.id}>
                            <div className="flex justify-between text-xs font-mono mb-1">
                              <span style={{ color: t.color }}>{t.label}</span>
                              <span className="text-ic-muted">{count.toLocaleString()} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-ic-border">
                              <div className="h-2" style={{ width: `${pct}%`, background: t.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-ic-border p-6">
                  <p className="section-label mb-6">RECENT TICKET SALES</p>
                  {data.recentTickets.length === 0 ? <Empty>NO TICKET SALES IN THIS PERIOD</Empty> : (
                    <div className="space-y-4">
                      {data.recentTickets.slice(0, 6).map(t => (
                        <div key={t.id} className="flex items-center justify-between py-3 border-b border-ic-border/30">
                          <div>
                            <p className="font-mono text-xs text-white">{t.members?.username ?? 'MEMBER'}</p>
                            <p className="font-mono text-[9px] text-ic-muted">{t.events?.title ?? 'EVENT'}</p>
                          </div>
                          <p className="font-mono text-[9px] text-ic-muted">{timeAgo(t.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── APPLICATIONS ─────────────────────────────────────────────── */}
          {tab === 'applications' && data && (
            <div className="space-y-4">
              {apps.length === 0 && <Empty>NO APPLICATIONS YET</Empty>}
              {apps.map(app => (
                <div key={app.id} className="border border-ic-border p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-mono text-sm text-white">{app.members?.username ?? app.user_name}</p>
                        {app.members?.tier && (
                          <span className="font-mono text-[9px] tracking-widest text-ic-gold">{app.members.tier.toUpperCase()}</span>
                        )}
                        <span className={`font-mono text-[9px] tracking-widest px-2 py-0.5 border ${STATUS_STYLES[app.status]}`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-ic-muted mb-3 break-all">
                        {app.type.toUpperCase()} · {app.user_email} · {timeAgo(app.created_at)}
                      </p>
                      <p className="text-ic-silver text-sm">{app.message}</p>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateApp(app.id, 'approved')}
                          className="flex items-center gap-1 border border-green-500/30 text-green-400 hover:bg-green-500/10 font-mono text-[10px] tracking-widest px-3 py-2"
                        >
                          <Check size={12} /> APPROVE
                        </button>
                        <button
                          onClick={() => updateApp(app.id, 'rejected')}
                          className="flex items-center gap-1 border border-ic-red/30 text-ic-red hover:bg-ic-red/10 font-mono text-[10px] tracking-widest px-3 py-2"
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
          {tab === 'events' && data && (
            <div className="space-y-4">
              <p className="text-ic-muted font-mono text-xs tracking-widest mb-2">
                {data.events.length} ACTIVE EVENTS · ADD OR EDIT EVENTS IN SUPABASE (TABLE: events)
              </p>
              {data.events.length === 0 && <Empty>NO ACTIVE EVENTS</Empty>}
              {data.events.map(ev => (
                <div key={ev.id} className="border border-ic-border p-6 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="font-bebas text-xl text-white">{ev.title}</p>
                    <p className="font-mono text-[10px] text-ic-muted">{new Date(ev.date).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bebas text-2xl text-ic-gold">{ev.sold}/{ev.capacity}</p>
                    <p className="font-mono text-[9px] text-ic-muted">SOLD</p>
                  </div>
                  <Link href={`/events/${ev.id}`} className="font-mono text-[9px] text-ic-muted hover:text-white tracking-widest">
                    VIEW →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* ── MEMBERS ──────────────────────────────────────────────────── */}
          {tab === 'members' && data && (
            <div>
              <p className="text-ic-muted font-mono text-xs tracking-widest mb-6">
                {data.overview.totalMembers.toLocaleString()} TOTAL MEMBERS · TOP 10 BY POINTS
              </p>
              {data.topMembers.length === 0 ? <Empty>NO MEMBERS YET</Empty> : (
                <div className="border border-ic-border overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ic-border">
                        {['#', 'MEMBER', 'TIER', 'POINTS'].map(h => (
                          <th key={h} className="text-left py-4 px-6 font-mono text-[9px] tracking-widest text-ic-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topMembers.map((m, i) => (
                        <tr key={m.id} className="border-b border-ic-border/30 hover:bg-ic-gray/20">
                          <td className="py-4 px-6 font-mono text-xs text-ic-muted">{i + 1}</td>
                          <td className="py-4 px-6 font-mono text-sm text-white">{m.username ?? '—'}</td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-[9px] tracking-widest px-2 py-0.5 border border-ic-gold/20 text-ic-gold">
                              {m.tier.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bebas text-lg text-ic-gold">{m.points.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── DROPS ────────────────────────────────────────────────────── */}
          {tab === 'inbox' && <AdminInbox key={inboxThread ?? 'inbox'} initialThread={inboxThread} />}

          {tab === 'refunds' && (
            <AdminRefunds onOpenThread={id => { setInboxThread(id); setTab('inbox'); }} />
          )}

          {tab === 'drops' && (
            <Empty>DROP MANAGEMENT ISN&apos;T BUILT YET · ADD DROPS IN SUPABASE (TABLE: drops)</Empty>
          )}
        </div>
      </main>
    </div>
  );
}
