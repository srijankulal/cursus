import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      message: 'MongoDB connection is healthy.',
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: 'MongoDB connection failed.',
      },
      { status: 500 }
    );
  }
}
