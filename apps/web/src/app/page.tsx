import { getSession } from "@/lib/session";
import { VenueMap } from "@/components/venue-map-loader";
import { VenueSearchBar } from "@/components/venue-search-bar";

export default async function HomePage() {
  const session = await getSession();
  const canCreate = session?.role === 'CREATOR' || session?.role === 'ADMINISTRATOR';

  return (
    <section className="relative h-[85vh] w-full">
      <VenueMap canCreate={canCreate} />
      <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
        <VenueSearchBar />
      </div>
    </section>
  );
}
