import { redirect } from 'next/navigation';
import { getSessionNavData } from '@/lib/session';
import { AdminClient } from './admin-client';

export const metadata = { title: 'Admin Panel' };

export default async function AdminPage() {
  const navData = await getSessionNavData();
  if (!navData || navData.role !== 'ADMINISTRATOR') redirect('/login');

  return <AdminClient currentUserId={navData.id} />;
}
