import type { Metadata } from "next";
import { PRICE_RANGE_SYMBOLS } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import type { ReviewSummaryDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVenueBySlug } from "@/lib/api";
import { getSessionUserId, hasSession } from "@/lib/session";
import { VenueMap } from "@/components/venue-map-loader";
import { WriteReviewForm } from "./write-review-form";
import { ReviewCard } from "./review-card";

type Props = {
  params: Promise<{ slug: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return {};

  const title = `${venue.name} — Reviews & Ratings`;
  const description =
    venue.reviewCount > 0 && venue.topRating !== null
      ? `${venue.reviewCount} reviews. Rated ${venue.topRating.toFixed(1)}/5.`
      : `${venue.name} — ${venue.category} in ${venue.city}.`;

  const ogParams = new URLSearchParams({
    venue: venue.name,
    category: venue.category,
    ...(venue.topRating !== null && { rating: venue.topRating.toFixed(1) }),
    count: String(venue.reviewCount),
  });
  const ogImage = `${siteUrl}/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1080, height: 1080, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ABBR: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};


export default async function VenuePage({ params }: Props) {
  const { slug } = await params;
  const [venue, sessionUserId, loggedIn] = await Promise.all([
    getVenueBySlug(slug),
    getSessionUserId(),
    hasSession(),
  ]);
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
              <ReviewCard
                key={review.id}
                review={review}
                slug={slug}
                venueName={venue.name}
                venueCategory={venue.category}
                canDelete={sessionUserId === review.author.id}
                canShare={loggedIn}
              />
            ))}
          </div>
        )}
      </div>

      {/* Write review */}
      <div className="mt-8">
        {loggedIn ? (
          (sessionUserId && venue.reviews.some((r: ReviewSummaryDto) => r.author.id === sessionUserId)) ? (
            <p className="text-sm text-muted">You&apos;ve already reviewed this venue.</p>
          ) : (
            <WriteReviewForm venueId={venue.id} slug={slug} />
          )
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
