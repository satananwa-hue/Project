import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json([], { status: 401 });

  const res = await fetch(`${API_BASE_URL}/invites/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json([], { status: res.status });

  const data = await res.json();
  return NextResponse.json(data);
}
