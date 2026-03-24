import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectToDatabase } from '@/lib/mongoose';
import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { Hod } from '@/models/hod';
import { Faculty } from '@/models/faculty';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!isSessionRole(roleValue) || roleValue !== 'hod') {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId =
      cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value ||
      request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Missing authenticated user id.' }, { status: 401 });
    }

    await connectToDatabase();

    const hod = await Hod.findOne({ user: userId }).exec();
    if (!hod) {
      return NextResponse.json({ ok: false, message: 'HOD not found' }, { status: 404 });
    }

    const faculties = await Faculty.find({
      department: hod.department,
      isActive: true,
    })
      .populate('user', 'name email')
      .select('_id user')
      .lean()
      .exec();

    const normalizedFaculties = faculties.map((faculty) => {
      const user = faculty.user as { name?: string; email?: string } | null;
      const legacyFaculty = faculty as unknown as { name?: string; email?: string };

      return {
        _id: faculty._id.toString(),
        name: user?.name ?? legacyFaculty.name ?? 'Unknown Faculty',
        email: user?.email ?? legacyFaculty.email ?? '',
      };
    });

    return NextResponse.json({ ok: true, faculties: normalizedFaculties });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch faculties' }, { status: 500 });
  }
}
