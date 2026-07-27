import { redirect } from 'next/navigation';
import { getSession, getSessionToken } from '@/lib/session';
import type { AccountDto, InviteDto } from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { AdminClient } from './admin-client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface AdminStats {
  accounts: number;
  venues: number;
  reviews: number;
  publishedVenues: number;
  pendingVenues: number;
}

async function fetchAdmin<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export const metadata = { title: 'Admin Panel' };

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMINISTRATOR') redirect('/login');

  const token = (await getSessionToken())!;

  const [stats, accounts, invites] = await Promise.all([
    fetchAdmin<AdminStats>('admin/stats', token),
    fetchAdmin<AccountDto[]>('admin/accounts', token),
    fetchAdmin<InviteDto[]>('admin/invites', token),
  ]);

  return (
    <AdminClient
      stats={stats}
      accounts={accounts}
      invites={invites}
      currentUserId={session.id}
    />
  );
}
