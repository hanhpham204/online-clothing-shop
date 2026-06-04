import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // 1. Add Authorization header for backend APIs (BFF pattern)
  // If request is calling /api/users, /api/products, etc. (excluding /api/auth since auth handles its own cookies)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const requestHeaders = new Headers(request.headers);
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
    
    // We return NextResponse.next() which allows the rewrite in next.config.ts to execute with our injected header
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 2. Protect frontend routes based on env variable
  // e.g. NEXT_PUBLIC_PROTECTED_ROUTES=/account,/checkout
  const protectedRoutesEnv = process.env.NEXT_PUBLIC_PROTECTED_ROUTES || '/account,/checkout';
  const protectedRoutes = protectedRoutesEnv.split(',').map(r => r.trim()).filter(Boolean);

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all paths except static files, images, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
