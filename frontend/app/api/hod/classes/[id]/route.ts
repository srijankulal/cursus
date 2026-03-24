import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_USER_ID_COOKIE_NAME, isSessionRole } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/mongoose';
import { Hod } from '@/models/hod';
import { Class } from '@/models/class';
import '@/models/student';

interface CourseAssignmentInput {
  subjectId?: string;
  subjectName?: string;
  faculty?: string;
}

// Helper to get current HOD from session
async function getCurrentHOD(request: NextRequest) {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!isSessionRole(roleValue) || roleValue !== 'hod') {
    return null;
  }

  const userId =
    cookieStore.get(SESSION_USER_ID_COOKIE_NAME)?.value ||
    request.headers.get('x-user-id');

  if (userId && !mongoose.isValidObjectId(userId)) {
    return null;
  }

  if (!userId) return null;

  await connectToDatabase();
  return await Hod.findOne({ user: userId }).exec();

}

// PUT - Update a class
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const hod = await getCurrentHOD(request);
    
    if (!hod) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

const { id } = await context.params;
    const body = await request.json();
    const { name, semester, capacity, classGuide, faculties, courseAssignments } = body;

    await connectToDatabase();

    const classToUpdate = await Class.findOne({
      _id: id,
      hod: hod._id,
    }).exec();

    if (!classToUpdate) {
      return NextResponse.json(
        { ok: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (name) classToUpdate.name = name;
    if (semester) classToUpdate.semester = semester;
    if (capacity) classToUpdate.capacity = capacity;
    if (classGuide) classToUpdate.classGuide = classGuide;

    if (Array.isArray(courseAssignments)) {
      const normalizedAssignments = courseAssignments
        .filter((assignment: CourseAssignmentInput) =>
          assignment?.subjectId && assignment?.subjectName && assignment?.faculty
        )
        .map((assignment: CourseAssignmentInput) => ({
          subjectId: String(assignment.subjectId).trim(),
          subjectName: String(assignment.subjectName).trim(),
          faculty: new mongoose.Types.ObjectId(String(assignment.faculty)),
        }));

      classToUpdate.courseAssignments = normalizedAssignments;

      const derivedFaculties = new Set<string>();
      const classGuideId = classGuide || classToUpdate.classGuide?.toString();

      if (classGuideId) {
        derivedFaculties.add(String(classGuideId));
      }

      normalizedAssignments.forEach((assignment) => {
        derivedFaculties.add(assignment.faculty.toString());
      });

      if (Array.isArray(faculties)) {
        faculties.forEach((facultyId: string) => derivedFaculties.add(String(facultyId)));
      }

      classToUpdate.faculties = Array.from(derivedFaculties).map(
        (facultyId) => new mongoose.Types.ObjectId(facultyId)
      );
    } else if (faculties) {
      classToUpdate.faculties = faculties;
    }

    await classToUpdate.save();

    const updatedClass = await Class.findById(id)
      .populate('classGuide', 'name email')
      .populate('faculties', 'name email')
      .populate('courseAssignments.faculty', 'name email')
      .populate('students', 'rollNumber')
      .exec();

    return NextResponse.json({
      ok: true,
      message: 'Class updated successfully',
      class: updatedClass,
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a class
export async function DELETE(
  request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  try {
    const hod = await getCurrentHOD(request);
    
    if (!hod) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    await connectToDatabase();

    const classToDelete = await Class.findOne({
      _id: id,
      hod: hod._id,
    }).exec();

    if (!classToDelete) {
      return NextResponse.json(
        { ok: false, message: 'Class not found' },
        { status: 404 }
      );
    }

    await Class.deleteOne({ _id: id });

    return NextResponse.json({
      ok: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to delete class' },
      { status: 500 }
    );
  }
}