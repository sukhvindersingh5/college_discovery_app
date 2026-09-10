import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const pathStr = (params.path || []).join('/');
  const search = req.nextUrl.search || '';
  const targetUrl = `${BACKEND}/api/${pathStr}${search}`;

  // Forward the original headers (auth token etc.) but strip host
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  let body: BodyInit | undefined;
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.text();
  }

  try {
    const backendRes = await fetch(targetUrl, { method, headers, body });
    const data = await backendRes.text();

    return new NextResponse(data, {
      status: backendRes.status,
      headers: { 'Content-Type': backendRes.headers.get('content-type') || 'application/json' },
    });
  } catch (err: any) {
    console.error('[Proxy error]', err.message);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
