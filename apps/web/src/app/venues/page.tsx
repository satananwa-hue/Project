import type { Metadata } from "next";
import { searchVenues } from "@/lib/api";
import { VenueCard } from "@/components/venue-card";
import { VenueMap } from "@/components/venue-map-loader";

export const metadata: Metadata = {
  title: "Venues in Bangkok",
  description: "Browse bars, clubs, rooftops, and lounges reviewed by ChiWitRakMaoChaAoWelaRakKhrai's trusted reviewer community.",
};

type Props = {
  searchParams: Promise<{ query?: string }>;
};

export default async function VenuesPage({ searchParams }: Props) {
  const { query } = await searchParams;
  const venues = await searchVenues(query);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        {query ? `Results for "${query}"` : "Venues in Bangkok"}
      </h1>
      {venues.length === 0 ? (
        <p className="text-muted">
          {query ? "No venues matched your search." : "No venues yet — check back soon."}
        </p>
      ) : (
        <>
          <div className="mb-8 h-96 overflow-hidden rounded-xl border border-border">
            <VenueMap markers={venues.map(v => ({
              id: v.id,
              name: v.name,
              lat: v.lat,
              lng: v.lng,
              categoryName: v.category,
              coverPhoto: v.photos[0] ?? null,
              rating: v.topRating !== null ? { overall: v.topRating, reviewCount: v.reviewCount } : undefined,
            }))} />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
