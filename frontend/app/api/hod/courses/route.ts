import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/mongoose';
import { Hod } from '@/models/hod';
import { Course } from '@/models/course';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!isSessionRole(roleValue) || roleValue !== 'hod') {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const semesterParam = request.nextUrl.searchParams.get('semester');
  const semester = Number(semesterParam);

  if (!Number.isInteger(semester) || semester < 1 || semester > 6) {
    return NextResponse.json({ ok: false, message: 'Valid semester is required.' }, { status: 400 });
  }

  const userId =
    cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value ||
    request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Missing authenticated user id.' }, { status: 401 });
  }

  await connectToDatabase();

  const hod = await Hod.findOne({ user: userId }).lean().exec();
  if (!hod) {
    return NextResponse.json({ ok: false, message: 'HOD not found' }, { status: 404 });
  }

  const courseDocs = await Course.find({
    semester,
    // department: hod.department,
  })
    .sort({ subject: 1 })
    .select('_id subject')
    .lean()
    .exec();

  const courses = courseDocs.map((course) => ({
    id: course._id.toString(),
    name: course.subject,
  }));

  return NextResponse.json({ ok: true, courses });
}
