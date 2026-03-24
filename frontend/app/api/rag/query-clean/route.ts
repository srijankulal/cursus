import { NextResponse } from 'next/server';

import { ragPost } from '@/lib/ragBackend';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { response, data } = await ragPost('/query-clean', payload);

    if (!response.ok) {
      const detail = data?.detail;
      const detailMessage =
        typeof detail === 'string'
          ? detail
          : typeof detail?.message === 'string'
            ? detail.message
            : null;

      return NextResponse.json(
        {
          ok: false,
          message: detailMessage || data?.message || 'Clean query failed.',
          detail: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Unable to query clean answer right now.' },
      { status: 500 }
    );
  }
}
