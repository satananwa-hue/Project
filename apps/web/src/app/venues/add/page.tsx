import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AddVenueClient } from './add-venue-client';

export const metadata = { title: 'Suggest a Venue' };

export default async function AddVenuePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Suggest a Venue</h1>
        <p className="mt-1 text-sm text-muted">
          Know a bar, club, or venue that isn&apos;t on the map? Add it here — it will be reviewed before going live.
        </p>
      </div>
      <AddVenueClient />
    </div>
  );
}
