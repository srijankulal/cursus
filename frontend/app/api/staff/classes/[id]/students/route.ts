import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectToDatabase } from '@/lib/mongoose';
import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { Faculty } from '@/models/faculty';
import { Class } from '@/models/class';
import { Student } from '@/models/student';
import '@/models/user';

async function getClassGuideClass(userId: string, classId: string) {
  const faculty = await Faculty.findOne({ user: userId, isActive: true }).exec();
  if (!faculty) {
    return { error: NextResponse.json({ ok: false, message: 'Faculty profile not found.' }, { status: 404 }) };
  }

  const classDoc = await Class.findById(classId).exec();
  if (!classDoc) {
    return { error: NextResponse.json({ ok: false, message: 'Class not found.' }, { status: 404 }) };
  }

  if (String(classDoc.classGuide) !== String(faculty._id)) {
    return {
      error: NextResponse.json(
        { ok: false, message: 'Only class guide can manage students for this class.' },
        { status: 403 }
      ),
    };
  }

  return { faculty, classDoc };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await Promise.resolve(params);

    await connectToDatabase();

    const ownership = await getClassGuideClass(userId, id);
    if (ownership.error) {
      return ownership.error;
    }

    const { classDoc } = ownership;

    const students = await Student.find({
      department: classDoc.department,
      semester: classDoc.semester,
      isActive: true,
    })
      .populate('user', 'name')
      .select('_id rollNumber class user')
      .sort({ rollNumber: 1 })
      .lean()
      .exec();

    const candidates = students.map((student) => {
      const user = student.user as { name?: string } | null;
      const assignedClassId = student.class ? String(student.class) : null;

      return {
        _id: student._id.toString(),
        rollNumber: student.rollNumber,
        name: user?.name ?? 'Student',
        assignedClassId,
        inSelectedClass: assignedClassId === String(classDoc._id),
      };
    });

    return NextResponse.json({ ok: true, candidates });
  } catch (error) {
    console.error('Error fetching candidate students:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch candidate students.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const rollNumber = String(body?.rollNumber ?? '').trim();

    if (!rollNumber) {
      return NextResponse.json({ ok: false, message: 'rollNumber is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const ownership = await getClassGuideClass(userId, id);
    if (ownership.error) {
      return ownership.error;
    }

    const { classDoc } = ownership;

    const student = await Student.findOne({ rollNumber }).exec();
    if (!student) {
      return NextResponse.json({ ok: false, message: 'Student not found.' }, { status: 404 });
    }

    if (student.department !== classDoc.department) {
      return NextResponse.json(
        { ok: false, message: 'Student belongs to a different department.' },
        { status: 400 }
      );
    }

    if (student.semester !== classDoc.semester) {
      return NextResponse.json(
        { ok: false, message: 'Student semester does not match class semester.' },
        { status: 400 }
      );
    }

    let movedFromClassId: string | null = null;
    if (student.class && String(student.class) !== String(classDoc._id)) {
      movedFromClassId = String(student.class);
      await Class.updateOne(
        { _id: student.class },
        { $pull: { students: student._id } }
      ).exec();
    }

    classDoc.students = classDoc.students ?? [];

    const existsInClass = classDoc.students.some(
      (studentId) => String(studentId) === String(student._id)
    );

    if (!existsInClass) {
      classDoc.students.push(student._id);
    }

    student.class = classDoc._id;

    await Promise.all([classDoc.save(), student.save()]);

    const updatedClass = await Class.findById(classDoc._id)
      .populate('students', 'rollNumber semester class')
      .lean()
      .exec();

    return NextResponse.json({
      ok: true,
      message: existsInClass
        ? 'Student already exists in this class.'
        : movedFromClassId
          ? 'Student moved to this class successfully.'
          : 'Student added to class.',
      class: {
        _id: updatedClass?._id.toString(),
        students: (updatedClass?.students ?? []).map((studentDoc) => {
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
        studentCount: updatedClass?.students?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('Error adding student to class:', error);
    return NextResponse.json({ ok: false, message: 'Failed to add student.' }, { status: 500 });
  }
}
