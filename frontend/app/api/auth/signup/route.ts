import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import {
  ensureUserIndexes,
  getUsersCollection,
  validateSignupInput,
} from '@/lib/auth/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateSignupInput(body);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    await ensureUserIndexes();

    const { name, email, password, role } = validation.data;
    const users = await getUsersCollection();
    const passwordHash = await hash(password, 12);

    const result = await users.insertOne({
      name,
      email,
      role,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Account created successfully.',
        user: {
          id: result.insertedId.toString(),
          name,
          email,
          role,
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
