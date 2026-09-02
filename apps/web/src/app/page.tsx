import { hasSession } from "@/lib/session";
import { VenueMap } from "@/components/venue-map-loader";

export default async function HomePage() {
  const isLoggedIn = await hasSession();
  const canCreate = isLoggedIn;

  return (
    <section className="relative h-full w-full">
      <VenueMap canCreate={canCreate} isLoggedIn={isLoggedIn} />
    </section>
  );
}
