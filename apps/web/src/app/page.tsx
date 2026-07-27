import { getSession } from "@/lib/session";
import { VenueMap } from "@/components/venue-map-loader";

export default async function HomePage() {
  const session = await getSession();
  const canCreate = !!session;
  const isLoggedIn = !!session;

  return (
    <section className="relative h-full w-full">
      <VenueMap canCreate={canCreate} isLoggedIn={isLoggedIn} />
    </section>
  );
}
