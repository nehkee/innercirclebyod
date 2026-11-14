'use client';

import { createContext, useContext } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

/** Whether ClerkProvider is mounted (set by the server from env keys). */
const AuthEnabledContext = createContext(false);
export const useAuthEnabled = () => useContext(AuthEnabledContext);

export default function Providers({
  children,
  authEnabled = false,
}: {
  children:     React.ReactNode;
  authEnabled?: boolean;
}) {
  return (
    <AuthEnabledContext.Provider value={authEnabled}>
      {/* Honour the OS "reduce motion" setting for every framer-motion animation */}
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
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
    </AuthEnabledContext.Provider>
  );
}
