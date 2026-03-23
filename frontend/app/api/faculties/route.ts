import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Faculty } from '@/models/faculty';
import { Hod } from '@/models/hod';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const hod = await Hod.findOne({ user: userId }).exec();

    if (!hod) {
      return NextResponse.json(
        { ok: false, message: 'HOD not found' },
        { status: 404 }
      );
    }

    const faculties = await Faculty.find({ 
      department: hod.department,
      isActive: true 
    }).select('name email').exec();

    return NextResponse.json({
      ok: true,
      faculties,
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}