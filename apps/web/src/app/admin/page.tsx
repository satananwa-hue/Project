import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AdminClient } from './admin-client';

export const metadata = { title: 'Admin Panel' };

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMINISTRATOR') redirect('/login');

  return <AdminClient currentUserId={session.id} />;
}
