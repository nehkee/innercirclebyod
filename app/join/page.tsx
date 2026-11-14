import { Suspense } from 'react';
import { Nav }      from '@/components/layout/Nav';
import { JoinForm } from './JoinForm';

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-ic-black flex flex-col">
      <Nav />

      {/* Gold radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, rgba(201,168,76,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scanline */}
      <div
        className="fixed left-0 right-0 h-px bg-ic-gold/10 pointer-events-none"
        style={{ animation: 'scanline 12s linear infinite' }}
      />

      <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-16">
        <div className="w-full max-w-xl">
          {/*
            Suspense required because JoinForm uses useSearchParams().
            Fallback is invisible — the form fades in anyway via Framer Motion.
          */}
          <Suspense fallback={null}>
            <JoinForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
