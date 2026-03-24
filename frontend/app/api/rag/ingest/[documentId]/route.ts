import { NextResponse } from 'next/server';

import { ragGet } from '@/lib/ragBackend';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const { response, data } = await ragGet(`/ingest/${documentId}`);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: data?.detail || data?.message || 'Failed to fetch ingestion status.',
          detail: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Unable to fetch ingestion status right now.' },
      { status: 500 }
    );
  }
}
