import { NextResponse } from 'next/server';

import { ragPost } from '@/lib/ragBackend';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { response, data } = await ragPost('/ingest', payload);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: data?.detail || data?.message || 'Ingestion failed.',
          detail: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Unable to ingest document right now.' },
      { status: 500 }
    );
  }
}
