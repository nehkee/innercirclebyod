'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const MANIFESTO_LINES = [
  { text: 'NOT A FAN CLUB.',   size: 'clamp(60px, 12vw, 180px)', gold: true  },
  { text: 'A SOCIETY.',        size: 'clamp(40px, 8vw, 120px)',  gold: false },
  { text: 'A SIGNAL.',         size: 'clamp(40px, 8vw, 120px)',  gold: false },
  { text: 'A MOVEMENT.',       size: 'clamp(40px, 8vw, 120px)',  gold: false },
  { text: 'THE CIRCLE.',       size: 'clamp(60px, 12vw, 180px)', gold: true  },
];

export function ManifestoSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="font-bebas text-white/[0.015] whitespace-nowrap"
          style={{ fontSize: 'clamp(100px, 25vw, 400px)' }}
        >
          IC ◯ IC ◯ IC ◯
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Label */}
        <motion.div
          className="flex items-center gap-4 mb-16"
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">THE MANIFESTO</p>
          <div className="h-px flex-1 bg-ic-border" />
        </motion.div>

        {/* Lines */}
        <div className="space-y-2">
          {MANIFESTO_LINES.map((line, i) => (
            <div key={i} className="overflow-hidden">
              <motion.p
                className={`font-bebas leading-none tracking-tight ${
                  line.gold ? 'gold-text' : 'text-white'
                }`}
                style={{ fontSize: line.size }}
                initial={{ y: '110%', opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{
                  delay: i * 0.1,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {line.text}
              </motion.p>
            </div>
          ))}
        </div>

        {/* Bio */}
        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-start"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="border-l-2 border-ic-gold pl-8">
            <p className="font-space text-ic-silver text-lg leading-relaxed mb-6">
              &ldquo;WHAT HAPPENS IN THE CIRCLE<br />
              STAYS IN THE CIRCLE.&rdquo;
            </p>
            <p className="font-mono text-[11px] tracking-[0.3em] text-ic-muted">
              — THE FIRST RULE
            </p>
          </div>

          <div>
            <p className="text-ic-muted text-sm leading-relaxed mb-4">
              Some music is made for everyone. Some rooms are not. Inner Circle is where the people closest to the culture get closer still: first listens, closed doors, real access.
            </p>
            <p className="text-ic-muted text-sm leading-relaxed mb-8">
              Not a fanpage. Not a newsletter. A living, breathing society for those who understand, with a seat that has to be earned and a code that is never broken.
            </p>
            <a href="/membership" className="btn-primary py-3 px-8 text-sm">
              CLAIM YOUR SEAT
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
