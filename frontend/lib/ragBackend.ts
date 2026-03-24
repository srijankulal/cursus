import 'server-only';

const DEFAULT_RAG_API_BASE_URL = 'http://127.0.0.1:8000';

function getBaseUrl() {
  return (
    process.env.RAG_API_BASE_URL ||
    process.env.NEXT_PUBLIC_RAG_API_BASE_URL ||
    DEFAULT_RAG_API_BASE_URL
  ).trim();
}

function buildUrl(path: string) {
  const normalizedBase = getBaseUrl().endsWith('/') ? getBaseUrl() : `${getBaseUrl()}/`;
  return new URL(path.replace(/^\//, ''), normalizedBase).toString();
}

export async function ragPost(path: string, payload: unknown) {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  return { response, data };
}

export async function ragGet(path: string) {
  const response = await fetch(buildUrl(path), {
    method: 'GET',
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  return { response, data };
}
