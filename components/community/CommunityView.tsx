'use client';

import { useState } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Trophy, Flame, Star, Globe, Users, MapPin } from 'lucide-react';
import type { CommunityStats, LeaderboardEntry } from '@/lib/data';
import { formatStat, countryFlag } from '@/lib/data-format';

const TIER_COLORS: Record<string, string> = {
  INDUSTRY: '#FFFFFF',
  WARLORD:  '#CC0000',
  INSIDER:  '#C9A84C',
  MACHINE:  '#9CA3AF',
};

const FEED = [
  { id: 1, user: 'WARLORD_ABUJA',    tier: 'INDUSTRY', action: 'attended LISTENING PARTY — LAGOS',       time: '2h ago', icon: '🎵' },
  { id: 2, user: 'INSIDER_LONDON',   tier: 'WARLORD',  action: 'entered MEET OD JUNE RAFFLE',            time: '4h ago', icon: '🎲' },
  { id: 3, user: 'MACHINE_ADEOLU',   tier: 'WARLORD',  action: 'upgraded from INSIDER to WARLORD',       time: '6h ago', icon: '⬆️' },
  { id: 4, user: 'NATIVESON',        tier: 'INSIDER',  action: 'applied for STUDIO SESSION',             time: '8h ago', icon: '🎙️' },
  { id: 5, user: 'OD_STEPH',         tier: 'INSIDER',  action: 'joined the Inner Circle',                time: '12h ago', icon: '⚙️' },
  { id: 6, user: 'CIRCUIT_KEMI',     tier: 'INSIDER',  action: 'purchased ticket to UNDERGROUND SHOW — LONDON', time: '1d ago', icon: '🎟️' },
];

const COUNTRIES = [
  { flag: '🇳🇬', name: 'Nigeria',     members: 8420, pct: 68 },
  { flag: '🇬🇧', name: 'UK',          members: 1840, pct: 15 },
  { flag: '🇺🇸', name: 'USA',         members: 990,  pct: 8  },
  { flag: '🇨🇦', name: 'Canada',      members: 310,  pct: 2.5 },
  { flag: '🇬🇭', name: 'Ghana',       members: 280,  pct: 2.3 },
  { flag: '🌍', name: 'Other',        members: 560,  pct: 4.5 },
];

interface CommunityViewProps {
  stats:       CommunityStats | null;
  leaderboard: LeaderboardEntry[];
  /** Feed and map are sample-only until they're backed by real data. */
  showSamples: boolean;
}

export function CommunityView({ stats, leaderboard, showSamples }: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed' | 'map'>('leaderboard');

  const LEADERBOARD = leaderboard.map(m => ({
    rank:    m.rank,
    name:    m.username,
    tier:    m.tier.toUpperCase(),
    points:  m.points,
    country: countryFlag(m.country),
    events:  m.eventsAttended ?? 0,
    joined:  m.joinedAt
      ? new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '—',
  }));

  const quickStats = stats
    ? [
        { icon: <Users size={16} />,  label: 'MEMBERS',   value: formatStat(stats.members) },
        { icon: <Globe size={16} />,  label: 'COUNTRIES', value: formatStat(stats.countries) },
        { icon: <Flame size={16} />,  label: 'EVENTS',    value: formatStat(stats.events) },
        { icon: <MapPin size={16} />, label: 'CITIES',    value: formatStat(stats.cities) },
      ]
    : [];

  const tabs = [
    { id: 'leaderboard', label: 'LEADERBOARD', icon: <Trophy size={12} /> },
    ...(showSamples
      ? [
          { id: 'feed', label: 'LIVE FEED',  icon: <Flame size={12} /> },
          { id: 'map',  label: 'GLOBAL MAP', icon: <Globe size={12} /> },
        ]
      : []),
  ];

  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-4">THE INNER CIRCLE</p>
          <h1
            className="font-bebas gold-text leading-none mb-6"
            style={{ fontSize: 'clamp(60px, 14vw, 160px)' }}
          >
            COMMUNITY
          </h1>

          {/* Quick Stats */}
          {quickStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {quickStats.map(stat => (
              <div key={stat.label} className="border border-od-border p-5">
                <div className="flex items-center gap-2 text-od-muted mb-3">{stat.icon}</div>
                <p className="font-bebas text-3xl text-white">{stat.value}</p>
                <p className="section-label mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="border-y border-od-border sticky top-16 md:top-20 z-30 bg-od-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-mono text-[10px] tracking-widest transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-od-gold text-od-gold'
                  : 'border-transparent text-od-muted hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Leaderboard */}
          {activeTab === 'leaderboard' && LEADERBOARD.length === 0 && (
            <div className="border border-od-border p-10 md:p-16 text-center">
              <p className="font-bebas text-3xl md:text-5xl text-white mb-3">THE LEADERBOARD IS WAITING</p>
              <p className="text-od-muted text-sm">Earn points by joining, attending events and entering raffles.</p>
            </div>
          )}

          {activeTab === 'leaderboard' && LEADERBOARD.length > 0 && (
            <div>
              <div className="mb-8 grid grid-cols-3 gap-4">
                {LEADERBOARD.slice(0, 3).map((member, i) => (
                  <div
                    key={member.rank}
                    className={`border p-6 text-center relative ${
                      i === 0 ? 'border-od-gold bg-od-gold/5 md:scale-105' :
                      i === 1 ? 'border-od-silver/30' : 'border-od-border'
                    }`}
                  >
                    {i === 0 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="font-bebas text-2xl">👑</span>
                      </div>
                    )}
                    <p className="font-mono text-3xl font-bold text-od-border mb-2">#{member.rank}</p>
                    <p className="font-mono text-sm tracking-wider text-white mb-1">{member.country} {member.name}</p>
                    <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: TIER_COLORS[member.tier] }}>
                      {member.tier}
                    </p>
                    <p className="font-bebas text-2xl" style={{ color: i === 0 ? '#C9A84C' : '#fff' }}>
                      {member.points.toLocaleString()}
                    </p>
                    <p className="font-mono text-[9px] text-od-muted">POINTS</p>
                  </div>
                ))}
              </div>

              <div className="border border-od-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-od-border">
                      <th className="text-left py-4 px-6 font-mono text-[10px] tracking-widest text-od-muted">RANK</th>
                      <th className="text-left py-4 px-6 font-mono text-[10px] tracking-widest text-od-muted">MEMBER</th>
                      <th className="text-left py-4 px-6 font-mono text-[10px] tracking-widest text-od-muted hidden md:table-cell">TIER</th>
                      <th className="text-left py-4 px-6 font-mono text-[10px] tracking-widest text-od-muted hidden md:table-cell">EVENTS</th>
                      <th className="text-right py-4 px-6 font-mono text-[10px] tracking-widest text-od-muted">POINTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEADERBOARD.map(member => (
                      <tr key={member.rank} className="border-b border-od-border/30 hover:bg-od-gray/20 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-od-muted text-sm">#{member.rank}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-mono text-sm text-white">{member.country} {member.name}</p>
                          <p className="font-mono text-[9px] text-od-muted">SINCE {member.joined}</p>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <span
                            className="font-mono text-[9px] tracking-widest px-2 py-1 border"
                            style={{ color: TIER_COLORS[member.tier], borderColor: `${TIER_COLORS[member.tier]}30` }}
                          >
                            {member.tier}
                          </span>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <span className="font-mono text-xs text-od-silver">{member.events}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bebas text-xl text-od-gold">{member.points.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Live Feed */}
          {showSamples && activeTab === 'feed' && (
            <div className="max-w-2xl space-y-3">
              {FEED.map(item => (
                <div key={item.id} className="flex items-start gap-4 border border-od-border p-4 hover:border-od-gold/30 transition-all">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-mono" style={{ color: TIER_COLORS[item.tier] }}>
                        {item.user}
                      </span>
                      {' '}
                      <span className="text-od-muted">{item.action}</span>
                    </p>
                    <p className="font-mono text-[9px] text-od-muted mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Global Map */}
          {showSamples && activeTab === 'map' && (
            <div>
              <p className="text-od-muted mb-8">Members in {COUNTRIES.length - 1}+ countries</p>
              <div className="space-y-4 max-w-lg">
                {COUNTRIES.map(country => (
                  <div key={country.name} className="flex items-center gap-4">
                    <span className="text-2xl w-8 flex-shrink-0">{country.flag}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-white">{country.name}</span>
                        <span className="text-od-gold">{country.members.toLocaleString()}</span>
                      </div>
                      <div className="h-1 bg-od-border">
                        <div
                          className="h-1 bg-od-gold transition-all duration-1000"
                          style={{ width: `${country.pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-od-muted w-10 text-right">{country.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
