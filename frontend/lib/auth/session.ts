export const SESSION_COOKIE_NAME = 'cursus_session_role';

export const ROLE_HOME_ROUTES = {
  hod: '/hod',
  staff: '/staff',
  students: '/student',
} as const;

export type SessionRole = keyof typeof ROLE_HOME_ROUTES;

export function isSessionRole(value: string | undefined): value is SessionRole {
  return value === 'hod' || value === 'staff' || value === 'students';
}

export function getRoleForPathname(pathname: string): SessionRole | null {
  if (pathname === '/hod' || pathname.startsWith('/hod/')) return 'hod';
  if (pathname === '/staff' || pathname.startsWith('/staff/')) return 'staff';
  if (pathname === '/student' || pathname.startsWith('/student/')) return 'students';
  return null;
}
