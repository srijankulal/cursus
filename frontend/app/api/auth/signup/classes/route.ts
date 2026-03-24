import { NextRequest, NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/mongoose';
import { Class } from '@/models/class';

export async function GET(request: NextRequest) {
  try {
    const semesterParam = request.nextUrl.searchParams.get('semester');
    const semester = Number(semesterParam);

    if (!Number.isInteger(semester) || semester < 1 || semester > 6) {
      return NextResponse.json(
        { ok: false, message: 'Valid semester is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const classes = await Class.find({
      department: 'BCA',
      semester,
    })
      .select('_id name semester')
      .sort({ name: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      ok: true,
      classes: classes.map((classDoc) => ({
        _id: classDoc._id.toString(),
        name: classDoc.name,
        semester: classDoc.semester,
      })),
    });
  } catch (error) {
    console.error('Error fetching signup classes:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch classes.' },
      { status: 500 }
    );
  }
}
