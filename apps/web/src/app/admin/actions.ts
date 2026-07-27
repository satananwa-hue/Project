'use server';
import { revalidatePath } from 'next/cache';
import { getSessionToken } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function authedFetch(method: string, path: string, body?: unknown) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return res;
}

export async function updateAccountRole(id: string, role: 'CREATOR' | 'ADMINISTRATOR') {
  const res = await authedFetch('PATCH', `admin/accounts/${id}`, { role });
  if (!res.ok) throw new Error('Failed to update role');
  revalidatePath('/admin');
}

export async function toggleAccountActive(id: string, active: boolean) {
  const res = await authedFetch('PATCH', `admin/accounts/${id}`, { active });
  if (!res.ok) throw new Error('Failed to toggle account');
  revalidatePath('/admin');
}

export async function adminResetPassword(id: string, newPassword: string) {
  const res = await authedFetch('POST', `admin/accounts/${id}/reset-password`, { newPassword });
  if (!res.ok) throw new Error('Failed to reset password');
}

export async function createInvite(note?: string) {
  const res = await authedFetch('POST', 'admin/invites', note ? { note } : {});
  if (!res.ok) throw new Error('Failed to create invite');
  revalidatePath('/admin');
}

export async function bulkCreateInvites(count: number) {
  const res = await authedFetch('POST', 'admin/invites/bulk', { count });
  if (!res.ok) throw new Error('Failed to bulk create invites');
  revalidatePath('/admin');
}

export async function revokeInvite(code: string) {
  const res = await authedFetch('DELETE', `admin/invites/${code}`);
  if (!res.ok) throw new Error('Failed to revoke invite');
  revalidatePath('/admin');
}
