import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Pages that need a signed-in user. Admin role is checked again server-side
// in app/admin/layout.tsx (needs a database lookup, which middleware avoids).
const isProtectedRoute = createRouteMatcher(['/admin(.*)']);

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (clerkConfigured) return withClerk(req, ev);

  // Clerk not configured: fail closed in production so /admin is never public.
  // In local development the admin UI stays viewable as a preview.
  if (isProtectedRoute(req) && process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
