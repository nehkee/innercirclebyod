'use client';

import { useEffect } from 'react';

/** Last-resort boundary (the root layout itself failed). Inline styles only. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/client-error', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message || 'Unknown error', digest: error.digest, path: window.location.pathname }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#080808', color: '#fff', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <p style={{ color: '#C9A84C', letterSpacing: '0.3em', fontSize: 12 }}>INNER CIRCLE</p>
          <h1 style={{ fontSize: 40, margin: '12px 0' }}>Something broke</h1>
          <p style={{ color: '#9CA3AF' }}>The team has been told.</p>
          <button onClick={reset} style={{ marginTop: 24, background: 'transparent', color: '#C9A84C', border: '1px solid #C9A84C', padding: '12px 28px', letterSpacing: '0.2em', cursor: 'pointer' }}>TRY AGAIN</button>
        </div>
      </body>
    </html>
  );
}
