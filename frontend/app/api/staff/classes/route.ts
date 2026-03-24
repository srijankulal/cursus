import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectToDatabase } from '@/lib/mongoose';
import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { Faculty } from '@/models/faculty';
import { Class } from '@/models/class';
import '@/models/student';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!isSessionRole(roleValue) || roleValue !== 'staff') {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value;
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'Missing authenticated user id.' }, { status: 401 });
    }

    await connectToDatabase();

    const faculty = await Faculty.findOne({ user: userId, isActive: true }).exec();
    if (!faculty) {
      return NextResponse.json({ ok: false, message: 'Faculty profile not found.' }, { status: 404 });
    }

    const classes = await Class.find({
      department: faculty.department,
      $or: [
        { classGuide: faculty._id },
        { 'courseAssignments.faculty': faculty._id },
      ],
    })
      .populate('classGuide', 'user')
      .populate('students', 'rollNumber semester class')
      .populate('courseAssignments.faculty', 'user')
      .sort({ semester: 1, name: 1 })
      .lean()
      .exec();

    const responseClasses = classes.map((classDoc) => {
      const isClassGuide = String(classDoc.classGuide?._id) === String(faculty._id);

      const assignedSubjects = (classDoc.courseAssignments ?? [])
        .filter((assignment) => String(assignment.faculty?._id ?? assignment.faculty) === String(faculty._id))
        .map((assignment) => ({
          subjectId: assignment.subjectId,
          subjectName: assignment.subjectName,
        }));

      return {
        _id: classDoc._id.toString(),
        name: classDoc.name,
        semester: classDoc.semester,
        department: classDoc.department,
        capacity: classDoc.capacity,
        studentCount: classDoc.students?.length ?? 0,
        students: (classDoc.students ?? []).map((studentDoc) => {
          const student = studentDoc as unknown as {
            _id: { toString: () => string };
            rollNumber: string;
            semester: number;
          };

          return {
            _id: student._id.toString(),
            rollNumber: student.rollNumber,
            semester: student.semester,
          };
        }),
        canManageStudents: isClassGuide,
        assignedSubjects,
      };
    });

    return NextResponse.json({
      ok: true,
      classes: responseClasses,
    });
  } catch (error) {
    console.error('Error fetching staff classes:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch classes.' }, { status: 500 });
  }
}
