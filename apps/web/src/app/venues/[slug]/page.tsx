import type { Metadata } from "next";
import type { ReviewSummaryDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import { PRICE_RANGE_SYMBOLS } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVenueBySlug } from "@/lib/api";
import { getSession } from "@/lib/session";
import { VenueMap } from "@/components/venue-map-loader";
import { WriteReviewForm } from "./write-review-form";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return {};

  const title = `${venue.name} — Reviews & Ratings`;
  const description =
    venue.reviewCount > 0 && venue.topRating !== null
      ? `${venue.reviewCount} reviews. Rated ${venue.topRating.toFixed(1)}/5.`
      : `${venue.name} — ${venue.category} in ${venue.city}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: venue.photos[0] ? [venue.photos[0]] : [],
    },
  };
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ABBR: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 365) return `${Math.floor(days / 365)}y ago`;
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function formatTag(tag: string): string {
  const parts = tag.split("-");
  if (parts.length === 2) {
    const cat = parts[0][0].toUpperCase() + parts[0].slice(1);
    const n = parseInt(parts[1], 10);
    if (!isNaN(n)) return `${cat} ${"★".repeat(n)}${"☆".repeat(5 - n)}`;
  }
  return tag;
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params;
  const [venue, session] = await Promise.all([getVenueBySlug(slug), getSession()]);
  if (!venue) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: venue.name,
    address: venue.address,
    geo: { "@type": "GeoCoordinates", latitude: venue.lat, longitude: venue.lng },
    aggregateRating:
      venue.reviewCount > 0 && venue.topRating !== null
        ? { "@type": "AggregateRating", ratingValue: venue.topRating, reviewCount: venue.reviewCount }
        : undefined,
  };

  const tags = [...venue.musicGenres, ...venue.crowdTypes];
  const priceSymbol = venue.priceRange ? (PRICE_RANGE_SYMBOLS[venue.priceRange] ?? null) : null;
  const todayName = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const hours = venue.hoursJson;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Photos */}
      {venue.photos.length > 0 && (
        <div className="mb-8 flex gap-2 overflow-x-auto rounded-xl">
          {venue.photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${venue.name} photo ${i + 1}`}
              className="h-52 w-80 flex-shrink-0 rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {/* Header */}
      <p className="text-sm text-muted">
        {venue.category.replace(/_/g, " ")}
        {priceSymbol && <span className="ml-2">{priceSymbol}</span>}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{venue.name}</h1>
      <p className="mt-2 text-muted">{venue.address}</p>
      {venue.createdByName && (
        <p className="mt-1.5 text-xs text-muted/60">
          Added by <span className="font-medium text-muted">{venue.createdByName}</span>
        </p>
      )}

      {/* Rating + directions */}
      <div className="mt-4 flex items-center gap-4">
        <span className="text-2xl font-semibold">
          {venue.reviewCount > 0 && venue.topRating !== null
            ? venue.topRating.toFixed(1)
            : "New"}
        </span>
        <span className="text-muted">
          {venue.reviewCount} {venue.reviewCount === 1 ? "review" : "reviews"}
        </span>
        {venue.coverCharge != null && (
          <span className="text-sm text-muted">Cover: ฿{venue.coverCharge}</span>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-full border border-border px-4 py-1.5 text-sm hover:bg-surface-raised"
        >
          Get directions →
        </a>
      </div>

      {/* Map */}
      <div className="mt-6 h-56 overflow-hidden rounded-xl border border-border">
        <VenueMap
          markers={[{
            id: venue.id,
            name: venue.name,
            lat: venue.lat,
            lng: venue.lng,
            categoryName: venue.category,
            rating: venue.topRating !== null
              ? { overall: venue.topRating, reviewCount: venue.reviewCount }
              : undefined,
          }]}
          showCenterPin
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hours */}
      {hours && Object.keys(hours).length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Hours</h2>
          <div className="rounded-lg border border-border bg-surface">
            {DAY_ORDER.filter((d) => d in hours).map((day) => {
              const isToday = day === todayName;
              return (
                <div
                  key={day}
                  className={`flex px-4 py-2.5 text-sm ${isToday ? "text-accent font-semibold" : "text-muted"} border-b border-border last:border-0`}
                >
                  <span className="w-10">{DAY_ABBR[day]}</span>
                  <span>{hours[day]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
        {venue.reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {venue.reviews.map((review: ReviewSummaryDto) => (
              <div key={review.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  {review.author.avatarUrl ? (
                    <img
                      src={review.author.avatarUrl}
                      alt={review.author.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {review.author.name[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{review.author.name}</p>
                    <p className="text-xs text-muted">{relativeDate(review.createdAt)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-sm">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={s <= review.rating ? "text-accent" : "text-border"}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {review.textBody && (
                  <p className="mt-3 text-sm leading-relaxed">{review.textBody}</p>
                )}
                {review.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {review.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent/80">
                        {formatTag(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write review */}
      <div className="mt-8">
        {session ? (
          <WriteReviewForm venueId={venue.id} slug={slug} />
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="underline hover:text-foreground">Sign in</Link>{" "}
            to write a review.
          </p>
        )}
      </div>
    </div>
  );
}
