'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useAuthEnabled } from '@/components/providers/Providers';

/** Sign-in link or account menu. Renders nothing until Clerk is configured. */
export function NavAuth({ mobile = false }: { mobile?: boolean }) {
  const enabled = useAuthEnabled();
  if (!enabled) return null;

  return (
    <>
      <SignedOut>
        <Link
          href="/sign-in"
          className={
            mobile
              ? 'font-mono text-xs tracking-widest text-ic-muted hover:text-ic-gold'
              : 'font-mono text-[11px] tracking-widest text-ic-muted hover:text-ic-gold transition-colors'
          }
        >
          SIGN IN
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          href="/account"
          className={
            mobile
              ? 'font-mono text-xs tracking-widest text-ic-muted hover:text-ic-gold'
              : 'font-mono text-[11px] tracking-widest text-ic-muted hover:text-ic-gold transition-colors'
          }
        >
          MY CIRCLE
        </Link>
        <UserButton />
      </SignedIn>
    </>
  );
}
