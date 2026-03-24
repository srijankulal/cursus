import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { isSessionRole, SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME } from '@/lib/auth/session';

export async function GET() {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const userId = cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value ?? null;
  const role = isSessionRole(roleValue) ? roleValue : null;

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(role),
    role,
    userId,
  });
}
