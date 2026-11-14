'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/** Something broke while rendering a page: tell the team, offer a way out. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/client-error', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message || 'Unknown error', digest: error.digest, path: window.location.pathname }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="bg-ic-black min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="section-label mb-4">SIGNAL LOST</p>
        <h1 className="font-bebas text-6xl text-white mb-4">SOMETHING BROKE</h1>
        <p className="text-ic-muted mb-8">The team has been told. Try again, or head back home.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary px-8 py-3 text-sm">TRY AGAIN</button>
          <Link href="/" className="btn-secondary px-8 py-3 text-sm">HOME</Link>
        </div>
      </div>
    </main>
  );
}
