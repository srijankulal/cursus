import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/user';
import { Hod } from '@/models/hod';
import { Class } from '@/models/class';

// Helper to get current HOD from session
async function getCurrentHOD(request: NextRequest) {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!isSessionRole(roleValue) || roleValue !== 'hod') {
    return null;
  }

  // Get user ID from request header (client should send this)
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;

  await connectToDatabase();
  return await Hod.findOne({ user: userId }).exec();

}

// GET - List all classes for the HOD's department
export async function GET(request: NextRequest) {
  try {
    const hod = await getCurrentHOD(request);
    
    if (!hod) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const classes = await Class.find({ hod: hod._id })
      .populate('classGuide', 'name email')
      .populate('faculties', 'name email')
      .populate('students', 'rollNumber')
      .sort({ semester: 1, name: 1 })
      .exec();

    return NextResponse.json({
      ok: true,
      classes,
      count: classes.length,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST - Create a new class
export async function POST(request: NextRequest) {
  try {
    const hod = await getCurrentHOD(request);
    
    if (!hod) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, semester, capacity, classGuide, faculties } = body;

    // Validation
    if (!name || !semester || !capacity || !classGuide) {
      return NextResponse.json(
        { ok: false, message: 'Missing required fields: name, semester, capacity, classGuide' },
        { status: 400 }
      );
    }

    if (semester < 1 || semester > 6) {
      return NextResponse.json(
        { ok: false, message: 'Semester must be between 1 and 6' },
        { status: 400 }
      );
    }

    if (capacity < 1) {
      return NextResponse.json(
        { ok: false, message: 'Capacity must be at least 1' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newClass = new Class({
      department: hod.department,
      name,
      semester,
      capacity,
      classGuide,
      faculties: faculties || [classGuide],
      hod: hod._id,
    });

    await newClass.save();

    const populatedClass = await newClass.populate([
      { path: 'classGuide', select: 'name email' },
      { path: 'faculties', select: 'name email' },
    ]);

    return NextResponse.json(
      {
        ok: true,
        message: 'Class created successfully',
        class: populatedClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to create class' },
      { status: 500 }
    );
  }
}