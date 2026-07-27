import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export async function POST(req: NextRequest) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.text();
  const res = await fetch(`${API}/venues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : {};
  return NextResponse.json(data, { status: res.status });
}
