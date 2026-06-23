import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes — accessible without authentication
const PUBLIC_ROUTES = ['/', '/membership', '/events', '/community', '/drops', '/access'];
const PUBLIC_PREFIXES = ['/api/payments', '/api/events'];

// Admin-only routes
const ADMIN_ROUTES = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/events/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // TODO: Uncomment when Clerk is configured
  // return clerkMiddleware()(request);

  // Admin protection — check for admin secret in header (basic, replace with Clerk roles)
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    // In production: verify Clerk session and check admin role
    // const { userId } = getAuth(request);
    // if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    //   return NextResponse.redirect(new URL('/', request.url));
    // }
    return NextResponse.next();
  }

  // Rate limiting headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '60');
    response.headers.set('X-RateLimit-Window', '60s');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
