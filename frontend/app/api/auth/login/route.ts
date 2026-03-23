import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';

import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import {
  findUserByEmailAndRole,
  validateLoginInput,
} from '@/lib/auth/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateLoginInput(body);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    const { email, password, role } = validation.data;
    const user = await findUserByEmailAndRole(email, role);

    if (!user) {
      return NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      message: 'Login successful.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: user.role,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: 'Unable to login right now.' }, { status: 500 });
  }
}
