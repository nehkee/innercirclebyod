'use client';

import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#FFFFFF',
            border: '1px solid #2A2A2A',
            fontFamily: 'var(--font-space)',
            fontSize: '0.85rem',
          },
          success: {
            iconTheme: { primary: '#C9A84C', secondary: '#000' },
          },
          error: {
            iconTheme: { primary: '#CC0000', secondary: '#000' },
          },
        }}
      />
    </>
  );
}
