import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectToDatabase } from '@/lib/mongoose';
import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { Student } from '@/models/student';
import '@/models/user';
import '@/models/class';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!isSessionRole(roleValue) || roleValue !== 'students') {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value;

    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Missing authenticated user id.' }, { status: 401 });
    }

    await connectToDatabase();

    const student = await Student.findOne({ user: userId, isActive: true })
      .populate('user', 'name email')
      .populate('class', 'name semester department')
      .lean()
      .exec();

    if (!student) {
      return NextResponse.json({ ok: false, message: 'Student profile not found.' }, { status: 404 });
    }

    const user = student.user as { name?: string; email?: string } | null;
    const classDoc = student.class as
      | { _id: { toString: () => string }; name?: string; semester?: number; department?: string }
      | null;

    return NextResponse.json({
      ok: true,
      profile: {
        _id: student._id.toString(),
        name: user?.name ?? 'Student',
        email: user?.email ?? '',
        department: student.department,
        semester: student.semester,
        rollNumber: student.rollNumber,
        class: classDoc
          ? {
              _id: classDoc._id.toString(),
              name: classDoc.name ?? 'Class',
              semester: classDoc.semester ?? student.semester,
              department: classDoc.department ?? student.department,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch profile.' }, { status: 500 });
  }
}
