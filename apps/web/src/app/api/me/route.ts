import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const profile = await getSession();
  if (!profile) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(profile);
}
