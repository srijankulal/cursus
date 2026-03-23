import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/user';
import {
  normalizeEmail,
  validateSignupInput,
} from '@/lib/auth/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateSignupInput(body);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    await connectToDatabase();

    const { name, email, password, role } = validation.data;
    const passwordHash = await hash(password, 12);

    const createdUser = await User.create({
      name,
      email: normalizeEmail(email),
      role,
      passwordHash,
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Account created successfully.',
        user: {
          id: createdUser._id.toString(),
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const duplicateErrorCode = 11000;

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === duplicateErrorCode
    ) {
      return NextResponse.json(
        { ok: false, message: 'User already exists for this role.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, message: 'Unable to create account right now.' },
      { status: 500 }
    );
  }
}
