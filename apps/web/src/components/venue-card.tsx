import Link from "next/link";
import type { VenueListItemDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

export function VenueCard({ venue }: { venue: VenueListItemDto }) {
  return (
    <Link
      href={`/venues/${venue.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent"
    >
      <div className="relative h-32 w-full bg-surface-raised">
        {venue.coverPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote media host isn't fixed yet, see components/venue-card.tsx
          <img
            src={venue.coverPhotoUrl}
            alt={venue.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium group-hover:text-accent">{venue.name}</h3>
        <p className="mt-1 text-sm text-muted">{venue.categoryName ?? "Nightlife venue"}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium">
            {venue.rating.reviewCount > 0 ? venue.rating.overall.toFixed(1) : "New"}
          </span>
          <span className="text-muted">
            {venue.rating.reviewCount} {venue.rating.reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>
    </Link>
  );
}
