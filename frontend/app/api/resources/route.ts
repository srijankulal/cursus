export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { QPNote } from '@/models/qp_notes';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester');

    await connectToDatabase();

    const query = semester ? { semester: Number(semester) } : {};
    const notes = await QPNote.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: notes.length, resources: notes });
  } catch (error: any) {
    console.error("GET /api/resources Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}