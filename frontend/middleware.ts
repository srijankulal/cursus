import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  getRoleForPathname,
  isSessionRole,
  ROLE_HOME_ROUTES,
  SESSION_COOKIE_NAME,
} from './lib/auth/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const expectedRole = getRoleForPathname(pathname);
  const cookieRoleValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionRole = isSessionRole(cookieRoleValue) ? cookieRoleValue : null;

  if (pathname === '/auth' && sessionRole) {
    return NextResponse.redirect(new URL(ROLE_HOME_ROUTES[sessionRole], request.url));
  }

  if (!expectedRole) {
    return NextResponse.next();
  }

  if (!sessionRole) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(authUrl);
  }

  if (sessionRole !== expectedRole) {
    return NextResponse.redirect(new URL(ROLE_HOME_ROUTES[sessionRole], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
