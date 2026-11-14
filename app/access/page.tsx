'use client';

import { useState } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Lock, Trophy, Zap, Users, Music, Utensils, Mic, Dribbble } from 'lucide-react';
import toast from 'react-hot-toast';

type ExperienceType = 'hangout' | 'studio' | 'dinner' | 'backstage' | 'football';

interface Experience {
  id:          ExperienceType;
  title:       string;
  description: string;
  icon:        React.ReactNode;
  spotsTotal:  number;
  spotsFilled: number;
  minTier:     string;
  color:       string;
}

const EXPERIENCES: Experience[] = [
  {
    id: 'hangout', title: 'FAN HANGOUT',
    description: 'Casual time with OD. The real OD. Small group, no cameras, no scripts. Just conversation.',
    icon: <Users size={20} />, spotsTotal: 12, spotsFilled: 9, minTier: 'INSIDER', color: '#C9A84C',
  },
  {
    id: 'studio', title: 'STUDIO SESSION',
    description: 'Watch the machine at work. Sit in on a real recording session. WARLORD+ only.',
    icon: <Music size={20} />, spotsTotal: 5, spotsFilled: 3, minTier: 'WARLORD', color: '#CC0000',
  },
  {
    id: 'dinner', title: 'PRIVATE DINNER',
    description: 'A closed-room dinner. OD, his team, and a handful of members. Unfiltered conversation.',
    icon: <Utensils size={20} />, spotsTotal: 8, spotsFilled: 5, minTier: 'WARLORD', color: '#CC0000',
  },
  {
    id: 'backstage', title: 'BACKSTAGE ACCESS',
    description: 'Pre-show and post-show. Real backstage. Not a meet-and-greet. You\'re in the building.',
    icon: <Mic size={20} />, spotsTotal: 10, spotsFilled: 7, minTier: 'INSIDER', color: '#C9A84C',
  },
  {
    id: 'football', title: 'FOOTBALL MATCH',
    description: 'OD plays. You play. Casual football somewhere in Lagos. MACHINE+ eligible.',
    icon: <Dribbble size={20} />, spotsTotal: 22, spotsFilled: 14, minTier: 'MACHINE', color: '#9CA3AF',
  },
];

const RAFFLES = [
  {
    id: 'r-001', title: 'MEET OD — JUNE RAFFLE', prize: 'One-on-one with Odumodublvck + signed vinyl',
    endsAt: '2026-06-01T23:59:59', entries: 847, maxEntries: 1000, priceNGN: 5000, minTier: 'MACHINE',
  },
  {
    id: 'r-002', title: 'NATIVE RECORDS STUDIO TOUR', prize: 'Full tour of Native Records HQ + photo with A&R team',
    endsAt: '2026-06-15T23:59:59', entries: 234, maxEntries: 500, priceNGN: 2500, minTier: 'MACHINE',
  },
  {
    id: 'r-003', title: 'UNRELEASED ALBUM PREVIEW', prize: 'Private listening session before public release',
    endsAt: '2026-07-01T23:59:59', entries: 156, maxEntries: 200, priceNGN: 10000, minTier: 'INSIDER',
  },
];

export default function AccessPage() {
  const [selectedExp, setSelectedExp] = useState<ExperienceType | null>(null);
  const [formData, setFormData]       = useState({ name: '', email: '', message: '' });
  const [loading, setLoading]         = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:      selectedExp,
          userName:  formData.name,
          userEmail: formData.email,
          message:   formData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.error === 'string'
          ? data.error
          : 'Please check your details. Your message needs at least 20 characters.';
        toast.error(msg);
        return;
      }
      toast.success('Application submitted. You\'ll hear back within 72 hours.');
      setFormData({ name: '', email: '', message: '' });
      setSelectedExp(null);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRaffle = async (id: string) => {
    toast.success('Redirecting to raffle entry checkout...');
  };

  return (
    <main className="bg-od-black min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-4">PRIVATE ACCESS</p>
          <h1
            className="font-bebas gold-text leading-none mb-6"
            style={{ fontSize: 'clamp(60px, 14vw, 160px)' }}
          >
            APPLY
          </h1>
          <p className="text-od-silver max-w-xl leading-relaxed">
            Not ticketed. Not publicised. Not for everyone.<br />
            These are the experiences that can&apos;t be bought outright.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <div className="h-px w-12 bg-od-gold/40" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-od-muted">
              APPLICATIONS REVIEWED MANUALLY BY OD&apos;S TEAM
            </p>
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="py-12 px-6 border-t border-od-border">
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-10">EXPERIENCES</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPERIENCES.map(exp => {
              const spotsLeft = exp.spotsTotal - exp.spotsFilled;
              const pct       = (exp.spotsFilled / exp.spotsTotal) * 100;
              const isFull    = spotsLeft <= 0;

              return (
                <button
                  key={exp.id}
                  onClick={() => !isFull && setSelectedExp(exp.id)}
                  className={`
                    text-left border p-6 transition-all duration-300 relative
                    ${selectedExp === exp.id
                      ? 'border-od-gold bg-od-gold/5'
                      : isFull
                        ? 'border-od-border opacity-40 cursor-not-allowed'
                        : 'border-od-border hover:border-od-gold/40 hover:bg-od-gray/20 cursor-none'
                    }
                  `}
                >
                  {isFull && (
                    <div className="absolute top-4 right-4">
                      <span className="font-mono text-[9px] tracking-widest text-od-muted border border-od-border px-2 py-0.5">FULL</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4" style={{ color: exp.color }}>
                    {exp.icon}
                    <span className="font-mono text-[9px] tracking-widest">{exp.minTier}+ TIER</span>
                  </div>

                  <h3 className="font-bebas text-2xl text-white mb-2">{exp.title}</h3>
                  <p className="text-od-muted text-sm leading-relaxed mb-6">{exp.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-od-muted">
                      <span>{spotsLeft} SPOTS REMAINING</span>
                      <span>{Math.round(pct)}% APPLIED</span>
                    </div>
                    <div className="h-px bg-od-border">
                      <div
                        className="h-px transition-all"
                        style={{ width: `${pct}%`, background: exp.color }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application Form */}
      {selectedExp && (
        <section className="py-16 px-6 border-t border-od-border">
          <div className="max-w-2xl mx-auto">
            <p className="section-label mb-4">APPLICATION FORM</p>
            <h2 className="font-bebas text-od-gold text-4xl mb-8">
              {EXPERIENCES.find(e => e.id === selectedExp)?.title}
            </h2>

            <div className="border border-od-gold/20 bg-od-gold/5 p-4 mb-8 flex items-start gap-3">
              <Lock size={14} className="text-od-gold flex-shrink-0 mt-0.5" />
              <p className="font-mono text-[10px] tracking-wider text-od-muted">
                Applications are reviewed by OD&apos;s team. Being a member doesn&apos;t guarantee approval. We look for genuine fans, cultural alignment, and energy.
              </p>
            </div>

            <form onSubmit={handleApply} className="space-y-6">
              <div>
                <label className="section-label block mb-2">YOUR NAME</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                  className="w-full bg-od-dark border border-od-border text-white px-4 py-3 font-space text-sm focus:border-od-gold focus:outline-none transition-colors placeholder:text-od-muted"
                  placeholder="What people call you"
                />
              </div>

              <div>
                <label className="section-label block mb-2">EMAIL</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                  className="w-full bg-od-dark border border-od-border text-white px-4 py-3 font-space text-sm focus:border-od-gold focus:outline-none transition-colors placeholder:text-od-muted"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="section-label block mb-2">WHY YOU</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
                  className="w-full bg-od-dark border border-od-border text-white px-4 py-3 font-space text-sm focus:border-od-gold focus:outline-none transition-colors placeholder:text-od-muted resize-none"
                  placeholder="Tell us why you deserve to be in the room. Be honest. Be real. Be brief."
                />
                <p className="font-mono text-[9px] text-od-muted mt-2">
                  Max 300 words. No essays. Keep it real.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base justify-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border border-od-gold border-t-transparent rounded-full animate-spin" />
                    SUBMITTING...
                  </span>
                ) : 'SUBMIT APPLICATION →'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Raffles */}
      <section className="py-20 px-6 border-t border-od-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <Trophy size={16} className="text-od-gold" />
            <p className="section-label">ACTIVE RAFFLES</p>
            <div className="h-px flex-1 bg-od-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RAFFLES.map(raffle => {
              const pct = (raffle.entries / raffle.maxEntries) * 100;

              return (
                <div key={raffle.id} className="border border-od-border p-6 flex flex-col card-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="badge-live">LIVE</span>
                    <span className="font-mono text-[9px] tracking-widest text-od-muted">{raffle.minTier}+ TIER</span>
                  </div>

                  <h3 className="font-bebas text-xl text-white mb-2">{raffle.title}</h3>
                  <p className="text-od-muted text-sm mb-4 flex-1">{raffle.prize}</p>

                  <div className="mb-4">
                    <p className="section-label mb-2">ENDS IN</p>
                    <CountdownTimer targetDate={raffle.endsAt} compact />
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-mono text-od-muted">
                      <span>{raffle.entries.toLocaleString()} ENTRIES</span>
                      <span>{raffle.maxEntries.toLocaleString()} MAX</span>
                    </div>
                    <div className="h-px bg-od-border">
                      <div className="h-px bg-od-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-xs text-od-muted">ENTRY PRICE</span>
                    <span className="font-bebas text-xl text-od-gold">
                      ₦{raffle.priceNGN.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRaffle(raffle.id)}
                    className="btn-primary w-full py-3 text-sm justify-center"
                  >
                    ENTER RAFFLE
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
