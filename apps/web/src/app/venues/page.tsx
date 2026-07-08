import type { Metadata } from "next";
import { getTrendingVenues } from "@/lib/api";
import { VenueCard } from "@/components/venue-card";

export const metadata: Metadata = {
  title: "Venues in Bangkok",
  description: "Browse bars, clubs, rooftops, and lounges reviewed by ChiWitRakMaoChaAoWelaRakKhrai's trusted reviewer community.",
};

export default async function VenuesPage() {
  const venues = await getTrendingVenues();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Venues in Bangkok</h1>
      {venues.length === 0 ? (
        <p className="text-muted">No venues yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}
