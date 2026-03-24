import 'server-only';

export const USER_ROLES = ['hod', 'staff', 'students'] as const;

export type UserRole = (typeof USER_ROLES)[number];

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: string;
  semester?: number | string;
  rollNumber?: string;
  classId?: string;
}

interface LoginInput {
  email: string;
  password: string;
  role: string;
}

export function normalizeEmail(value: string) {
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

  const semesterValue = Number(input.semester);
  const rollNumber = String(input.rollNumber ?? '').trim();
  const classId = String(input.classId ?? '').trim();

  if (role === 'students') {
    if (!Number.isInteger(semesterValue) || semesterValue < 1 || semesterValue > 6) {
      return { ok: false as const, message: 'Please provide a valid semester between 1 and 6.' };
    }

    if (!rollNumber) {
      return { ok: false as const, message: 'Roll number is required for student signup.' };
    }
  }

  return {
    ok: true as const,
    data: {
      name,
      email,
      password,
      role,
      semester: role === 'students' ? semesterValue : undefined,
      rollNumber: role === 'students' ? rollNumber : undefined,
      classId: role === 'students' && classId ? classId : undefined,
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
