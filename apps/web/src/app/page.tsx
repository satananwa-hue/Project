import { Suspense } from "react";
import { getTrendingVenues } from "@/lib/api";
import { VenueCard } from "@/components/venue-card";
import { VenueMap } from "@/components/venue-map-loader";
import { VenueSearchBar } from "@/components/venue-search-bar";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative h-[75vh] w-full">
        <Suspense fallback={<div className="h-full w-full bg-surface-raised" />}>
          <HomeMap />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-6">
          <VenueSearchBar />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Trending in Bangkok</h2>
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingVenues />
        </Suspense>
      </section>
    </div>
  );
}

async function HomeMap() {
  const venues = await getTrendingVenues();
  return <VenueMap markers={venues} />;
}

async function TrendingVenues() {
  const venues = await getTrendingVenues();

  if (venues.length === 0) {
    return (
      <p className="text-muted">
        No venues yet — check back soon as the Bangkok community grows.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
