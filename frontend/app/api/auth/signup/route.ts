import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import mongoose from 'mongoose';

import { connectToDatabase } from '@/lib/mongoose';
import User, { type IUser } from '@/models/user';
import { Hod } from '@/models/hod';
import { Faculty } from '@/models/faculty';
import { Student } from '@/models/student';
import { Class } from '@/models/class';
import {
  normalizeEmail,
  type UserRole,
  validateSignupInput,
} from '@/lib/auth/users';

interface StudentSignupData {
  semester?: number;
  rollNumber?: string;
  classId?: string;
}

async function createRoleProfile(
  userId: mongoose.Types.ObjectId,
  role: UserRole,
  studentData: StudentSignupData,
  session: mongoose.ClientSession
) {
  if (role === 'hod') {
    const hod = new Hod({
      user: userId,
      department: 'BCA',
      isActive: true,
    });
    await hod.save({ session });
    return;
  }

  if (role === 'staff') {
    const faculty = new Faculty({
      user: userId,
      department: 'BCA',
      assignedClasses: [],
      isActive: true,
    });
    await faculty.save({ session });
    return;
  }

  const semester = studentData.semester ?? 1;
  const rollNumber = studentData.rollNumber ?? `TEMP-${userId.toString().slice(-8).toUpperCase()}`;

  const student = new Student({
    user: userId,
    department: 'BCA',
    semester,
    rollNumber,
    isActive: true,
  });

  if (studentData.classId) {
    const classDoc = await Class.findById(studentData.classId).session(session).exec();

    if (!classDoc) {
      throw new Error('Selected class does not exist.');
    }

    if (classDoc.department !== student.department) {
      throw new Error('Selected class department does not match student department.');
    }

    if (classDoc.semester !== semester) {
      throw new Error('Selected class semester does not match student semester.');
    }

    student.class = classDoc._id;
  }

  await student.save({ session });

  if (student.class) {
    await Class.updateOne(
      { _id: student.class },
      { $addToSet: { students: student._id } },
      { session }
    ).exec();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateSignupInput(body);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    await connectToDatabase();

    const { name, email, password, role, semester, rollNumber, classId } = validation.data;
    const passwordHash = await hash(password, 12);
    const session = await mongoose.startSession();
    let createdUser: mongoose.HydratedDocument<IUser>;

    try {
      session.startTransaction();

      createdUser = await User.create(
        [
          {
            name,
            email: normalizeEmail(email),
            role,
            passwordHash,
          },
        ],
        { session }
      ).then((docs) => docs[0]);

      await createRoleProfile(createdUser._id, role, { semester, rollNumber, classId }, session);
      await session.commitTransaction();
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      await session.endSession();
    }

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

    if (error instanceof Error && /Selected class/.test(error.message)) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: 'Unable to create account right now.' },
      { status: 500 }
    );
  }
}
