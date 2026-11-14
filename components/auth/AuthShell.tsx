import Link from 'next/link';

interface AuthShellProps {
  title:    string;
  subtitle: string;
  /** The Clerk form, or null when Clerk isn't configured. */
  children: React.ReactNode | null;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="bg-od-black min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="w-12 h-12 border border-od-gold flex items-center justify-center mx-auto mb-4"
            aria-label="Inner Circle home"
          >
            <span className="font-bebas text-od-gold text-2xl leading-none">OD</span>
          </Link>
          <h1 className="font-bebas text-4xl gold-text">{title}</h1>
          <p className="font-mono text-[10px] tracking-widest text-od-muted mt-1">{subtitle}</p>
        </div>

        {children ? (
          <div className="flex justify-center">{children}</div>
        ) : (
          <div className="border border-od-border p-8 text-center">
            <p className="font-mono text-xs text-od-muted tracking-widest mb-4">
              SIGN-IN IS NOT SWITCHED ON YET
            </p>
            <p className="text-od-muted text-sm mb-8">
              Add the Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY) to enable accounts.
            </p>
            <Link href="/" className="btn-primary py-3 px-8 text-sm inline-flex">
              ← BACK TO HOME
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
