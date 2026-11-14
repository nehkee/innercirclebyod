import { notFound, redirect } from 'next/navigation';
import { isClerkConfigured, requireAdmin } from '@/lib/auth';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Admin | Inner Circle', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) {
    // Never expose the dashboard in production without real sign-in.
    if (process.env.NODE_ENV === 'production') notFound();

    return (
      <>
        <div className="bg-ic-red text-white font-mono text-[10px] tracking-widest text-center py-2">
          LOCAL PREVIEW — CLERK IS NOT CONFIGURED, SO THIS PAGE IS UNPROTECTED AND HAS NO LIVE DATA
        </div>
        {children}
      </>
    );
  }

  const check = await requireAdmin();
  if (!check.ok) {
    if (check.status === 401) redirect('/sign-in?redirect_url=/admin');
    notFound(); // signed in but not an admin: don't reveal the page exists
  }

  return <>{children}</>;
}
