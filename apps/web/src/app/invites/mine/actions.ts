'use server';

import { revalidatePath } from 'next/cache';
import { getSessionToken } from '@/lib/session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export async function generateInviteCodesAction(count: number): Promise<{ ok: boolean; created?: number; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: 'Not authenticated' };

  const res = await fetch(`${API_BASE_URL}/admin/invites/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ count }),
  });

  if (!res.ok) return { ok: false, error: 'Failed to generate codes' };
  const data = (await res.json()) as { created: number };
  revalidatePath('/invites/mine');
  return { ok: true, created: data.created };
}
