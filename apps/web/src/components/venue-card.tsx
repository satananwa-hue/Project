import Link from "next/link";
import type { VenueListItemDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const CATEGORY_COLORS: Record<string, string> = {
  BAR:        "bg-violet-500/15 text-violet-300 border-violet-500/25",
  CLUB:       "bg-blue-500/15 text-blue-300 border-blue-500/25",
  ROOFTOP:    "bg-teal-500/15 text-teal-300 border-teal-500/25",
  LIVE_MUSIC: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  LOUNGE:     "bg-pink-500/15 text-pink-300 border-pink-500/25",
  OTHER:      "bg-gray-500/15 text-gray-400 border-gray-500/25",
};

function formatDistance(m: number | null): string {
  if (m === null) return "";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function CategoryBadge({ category }: { category: string }) {
  const label = category.replace(/_/g, " ");
  const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.OTHER;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

export function VenueCard({ venue }: { venue: VenueListItemDto }) {
  const coverPhoto = venue.photos[0] ?? null;
  const dist = formatDistance(venue.distanceM);

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/60"
    >
      {/* Cover photo */}
      <div className="relative h-36 w-full bg-surface-raised flex-shrink-0">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto} alt={venue.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Name + category + distance row */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-snug group-hover:text-accent truncate">{venue.name}</h3>
            <div className="mt-1">
              <CategoryBadge category={venue.category} />
            </div>
          </div>
          {dist && (
            <span className="flex-shrink-0 text-xs text-muted mt-0.5">{dist}</span>
          )}
        </div>

        {/* Rating + reviews */}
        <div className="flex items-center gap-2 mt-auto">
          {venue.reviewCount > 0 && venue.topRating !== null ? (
            <>
              <div className="flex items-center gap-1 text-xs text-accent">
                {"★".repeat(Math.round(venue.topRating))}
                <span className="text-border">{"★".repeat(5 - Math.round(venue.topRating))}</span>
              </div>
              <span className="text-xs font-semibold">{venue.topRating.toFixed(1)}</span>
              <span className="text-xs text-muted">· {venue.reviewCount} {venue.reviewCount === 1 ? "review" : "reviews"}</span>
            </>
          ) : (
            <span className="text-xs text-muted">New · no reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
