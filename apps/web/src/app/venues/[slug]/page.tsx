import type { Metadata } from "next";
import type { ReviewSummaryDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
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
        ? {
            "@type": "AggregateRating",
            ratingValue: venue.topRating,
            reviewCount: venue.reviewCount,
          }
        : undefined,
  };

  const tags = [...venue.musicGenres, ...venue.crowdTypes];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="text-sm text-muted">{venue.category}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{venue.name}</h1>
      <p className="mt-2 text-muted">{venue.address}</p>

      <div className="mt-6 flex items-center gap-4">
        <span className="text-2xl font-semibold">
          {venue.reviewCount > 0 && venue.topRating !== null
            ? venue.topRating.toFixed(1)
            : "New"}
        </span>
        <span className="text-muted">
          {venue.reviewCount} {venue.reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>

      <div className="mt-6 h-64 overflow-hidden rounded-xl border border-border">
        <VenueMap
          markers={[
            {
              id: venue.id,
              name: venue.name,
              lat: venue.lat,
              lng: venue.lng,
              categoryName: venue.category,
              rating:
                venue.topRating !== null
                  ? { overall: venue.topRating, reviewCount: venue.reviewCount }
                  : undefined,
            },
          ]}
          showCenterPin
        />
      </div>

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {venue.reviews.length > 0 && (
        <div className="mt-10 flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Reviews</h2>
          {venue.reviews.map((review: ReviewSummaryDto) => (
            <div key={review.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                {review.author.avatarUrl && (
                  <img
                    src={review.author.avatarUrl}
                    alt={review.author.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{review.author.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="ml-auto text-sm font-semibold">{review.rating.toFixed(1)}</span>
              </div>
              {review.textBody && (
                <p className="mt-3 text-sm leading-relaxed">{review.textBody}</p>
              )}
              {review.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {review.tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        {session ? (
          <WriteReviewForm venueId={venue.id} slug={slug} />
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="underline hover:text-foreground">
              Sign in
            </Link>{" "}
            to write a review.
          </p>
        )}
      </div>
    </div>
  );
}