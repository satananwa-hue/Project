import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function proxy(req: NextRequest, segments: string[]) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiPath = `admin/${segments.join('/')}`;
  const hasBody = req.method !== 'GET' && req.method !== 'DELETE';
  const body = hasBody ? await req.text() : undefined;

  const res = await fetch(`${API}/${apiPath}`, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body } : {}),
    cache: 'no-store',
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  return NextResponse.json(data, { status: res.status });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, (await ctx.params).path);
}
