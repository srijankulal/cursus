import 'server-only';

import { ObjectId } from 'mongodb';

import { getDb } from '@/lib/mongodb';

export const USER_ROLES = ['hod', 'staff', 'students'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface LoginInput {
  email: string;
  password: string;
  role: string;
}

let ensureIndexesPromise: Promise<void> | null = null;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function validateSignupInput(input: SignupInput) {
  const { password, role } = input;
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (!name || !email || !password || !role) {
    return { ok: false as const, message: 'All fields are required.' };
  }

  if (!isValidRole(role)) {
    return { ok: false as const, message: 'Please select a valid role.' };
  }

  if (password.length < 8) {
    return { ok: false as const, message: 'Password must be at least 8 characters.' };
  }

  return {
    ok: true as const,
    data: {
      name,
      email,
      password,
      role,
    },
  };
}

export function validateLoginInput(input: LoginInput) {
  const { password, role } = input;
  const email = normalizeEmail(input.email);

  if (!email || !password || !role) {
    return { ok: false as const, message: 'Email, password and role are required.' };
  }

  if (!isValidRole(role)) {
    return { ok: false as const, message: 'Please select a valid role.' };
  }

  return {
    ok: true as const,
    data: {
      email,
      password,
      role,
    },
  };
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection<UserDocument>('users');
}

export async function ensureUserIndexes() {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = (async () => {
      const users = await getUsersCollection();
      await users.createIndex({ email: 1, role: 1 }, { unique: true, name: 'email_role_unique' });
    })();
  }

  await ensureIndexesPromise;
}

export async function findUserByEmailAndRole(email: string, role: UserRole) {
  const users = await getUsersCollection();
  return users.findOne({ email: normalizeEmail(email), role });
}
