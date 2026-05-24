import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for API authentication routes to prevent interception
  if (pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }

  // Retrieve the session cookie
  const token = request.cookies.get('admin-session')?.value;
  const decoded = token ? await verifySessionToken(token) : null;
  const isAuthenticatedAdmin = decoded && decoded.role === 'admin';

  // 2. If trying to access login page: redirect to admin panel if already authenticated
  if (pathname.startsWith('/admin/login')) {
    if (isAuthenticatedAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect all other admin pathways
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticatedAdmin) {
      console.log(`Unauthenticated admin route access blocked for: ${pathname}. Redirecting to login.`);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Next.js config matcher to focus middleware on administrative panels
export const config = {
  matcher: ['/admin/:path*'],
};
