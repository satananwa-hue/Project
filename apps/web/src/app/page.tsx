import { VenueMap } from "@/components/venue-map-loader";
import { VenueSearchBar } from "@/components/venue-search-bar";

export default function HomePage() {
  return (
    <section className="relative h-[85vh] w-full">
      <VenueMap />
      <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-6">
        <VenueSearchBar />
      </div>
    </section>
  );
}
