'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TIERS } from '@/lib/constants';

type State = 'idle' | 'loading' | 'success' | 'error';

const RULES = [
  'No leaks. No screenshots. No excuses.',
  'The circle protects its own.',
  'First in. First to know. First through the door.',
];

export function JoinForm() {
  const params = useSearchParams();
  const tierId = params.get('tier');
  const tier   = TIERS.find(t => t.id === tierId) ?? null;

  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [state,  setState]  = useState<State>('idle');
  const [errMsg, setErrMsg] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setState('loading');
    setErrMsg('');

    try {
      const res  = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrMsg(data.error ?? 'Something went wrong.');
        setState('error');
        return;
      }

      setState('success');
    } catch {
      setErrMsg('Network error. Try again.');
      setState('error');
    }
  }

  return (
    <AnimatePresence mode="wait">

      {/* ── Form ─────────────────────────────────────────────────────── */}
      {state !== 'success' && (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Label */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-ic-gold/40" />
            <p className="font-mono text-[11px] tracking-[0.5em] text-ic-gold">
              {tier ? `${tier.name} TIER — STEP 1 OF 2` : 'THE INVITATION'}
            </p>
            <div className="h-px w-12 bg-ic-gold/40" />
          </div>

          {/* Tier pill */}
          {tier && (
            <motion.div
              className="inline-flex items-center gap-2 border px-3 py-1.5 mb-6"
              style={{ borderColor: `rgba(${tier.colorRgb},0.5)`, background: `rgba(${tier.colorRgb},0.07)` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
              <span className="font-mono text-[11px] tracking-widest" style={{ color: tier.color }}>
                {tier.name} · ₦{tier.priceNGN.toLocaleString()}/mo
              </span>
            </motion.div>
          )}

          {/* Headline */}
          <div className="overflow-hidden mb-2">
            <motion.h1
              className="glitch font-bebas leading-none text-white select-none"
              data-text="ENTER THE"
              style={{ fontSize: 'clamp(52px, 12vw, 110px)' }}
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              ENTER THE
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-8">
            <motion.h1
              className="glitch font-bebas leading-none gold-text select-none"
              data-text="CIRCLE"
              style={{ fontSize: 'clamp(52px, 12vw, 110px)' }}
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            >
              CIRCLE
            </motion.h1>
          </div>

          {/* Subtext */}
          <motion.p
            className="text-ic-silver text-sm leading-relaxed mb-8 max-w-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {tier
              ? `Good choice. Before you lock in your ${tier.name} membership, drop your details — payments open shortly and you'll be first in line.`
              : 'Drop your name and email. When the doors open, you will be the first to know — and the first through.'
            }
          </motion.p>

          {/* Rules */}
          <motion.div
            className="mb-10 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {RULES.map((r, i) => (
              <p key={i} className="font-mono text-[11px] tracking-widest text-ic-muted">
                <span className="text-ic-gold mr-2">—</span>{r}
              </p>
            ))}
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            {/* Name */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.35em] text-ic-muted mb-2">
                YOUR NAME
              </label>
              <input
                ref={nameRef}
                type="text"
                required
                autoComplete="name"
                placeholder="First & last name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={state === 'loading'}
                className="
                  w-full bg-ic-dark border border-ic-border
                  text-white font-mono text-sm tracking-wider
                  px-5 py-4 outline-none
                  placeholder:text-ic-muted/40
                  transition-all duration-300
                  focus:border-ic-gold focus:bg-ic-gray/30
                  disabled:opacity-40
                "
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.35em] text-ic-muted mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={state === 'loading'}
                className="
                  w-full bg-ic-dark border border-ic-border
                  text-white font-mono text-sm tracking-wider
                  px-5 py-4 outline-none
                  placeholder:text-ic-muted/40
                  transition-all duration-300
                  focus:border-ic-gold focus:bg-ic-gray/30
                  disabled:opacity-40
                "
              />
            </div>

            {/* Error */}
            {state === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] tracking-widest text-ic-red"
              >
                ✕ {errMsg}
              </motion.p>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={state === 'loading' || !name.trim() || !email.trim()}
                className="
                  w-full relative overflow-hidden
                  border border-ic-gold
                  font-bebas tracking-widest text-lg
                  px-10 py-4 text-ic-gold
                  transition-all duration-300
                  hover:text-ic-black
                  disabled:opacity-40 disabled:cursor-not-allowed
                  group
                "
              >
                <span className="absolute inset-0 bg-ic-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 -z-0" />
                <span className="relative z-10">
                  {state === 'loading' ? (
                    <span className="flex items-center justify-center gap-3">
                      <LoadingDots />
                      SECURING YOUR SPOT
                    </span>
                  ) : (
                    'ENTER THE CIRCLE ◯'
                  )}
                </span>
              </button>
            </div>

            <p className="font-mono text-[10px] tracking-widest text-ic-muted text-center pt-1">
              ALREADY A MEMBER?{' '}
              <Link href="/sign-in" className="text-ic-gold hover:underline">
                SIGN IN
              </Link>
              {' · '}HAVE AN INVITE?{' '}
              <Link href="/invite" className="text-ic-gold hover:underline">
                ENTER CODE
              </Link>
            </p>
          </motion.form>
        </motion.div>
      )}

      {/* ── Success ───────────────────────────────────────────────────── */}
      {state === 'success' && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          {/* Gold ring */}
          <div className="relative inline-flex items-center justify-center mb-10">
            <div
              className="w-20 h-20 rounded-full border border-ic-gold"
              style={{ animation: 'glow-gold 2.5s ease-in-out infinite' }}
            />
            <span className="absolute font-bebas text-ic-gold text-3xl">◯</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-ic-gold/40" />
            <p className="font-mono text-[11px] tracking-[0.5em] text-ic-gold">YOU&apos;RE IN</p>
            <div className="h-px w-12 bg-ic-gold/40" />
          </div>

          <div className="overflow-hidden mb-2">
            <motion.h2
              className="font-bebas text-white leading-none"
              style={{ fontSize: 'clamp(48px, 10vw, 100px)' }}
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              WELCOME TO
            </motion.h2>
          </div>
          <div className="overflow-hidden mb-10">
            <motion.h2
              className="font-bebas gold-text leading-none"
              style={{ fontSize: 'clamp(48px, 10vw, 100px)' }}
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              THE CIRCLE
            </motion.h2>
          </div>

          <motion.p
            className="text-ic-silver text-sm leading-relaxed max-w-sm mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Check your inbox. A message is waiting.{' '}
            <span className="text-ic-gold">
              {name.split(' ')[0] ? `${name.split(' ')[0]}, ` : ''}the circle sees you.
            </span>
          </motion.p>

          <motion.div
            className="border border-ic-border bg-ic-gray/20 p-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-mono text-[11px] tracking-widest text-ic-muted mb-1">
              CONFIRMATION SENT TO
            </p>
            <p className="font-mono text-sm text-ic-gold tracking-wider">{email}</p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/membership" className="btn-primary px-10 py-3 text-base">
              VIEW MEMBERSHIP TIERS
            </Link>
            <Link href="/events" className="btn-secondary px-10 py-3 text-base">
              SEE EVENTS
            </Link>
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 bg-ic-gold rounded-full inline-block"
          style={{ animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}
