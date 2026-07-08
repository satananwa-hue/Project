import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVenueBySlug } from "@/lib/api";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return {};

  const title = `${venue.name} — Reviews & Ratings`;
  const description =
    venue.description ??
    `${venue.rating.reviewCount} reviews from ChiWitRakMaoChaAoWelaRakKhrai's trusted reviewer community. Rated ${venue.rating.overall.toFixed(1)}/5.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: venue.coverPhotoUrl ? [venue.coverPhotoUrl] : [],
    },
  };
}

const DIMENSION_LABELS: Record<string, string> = {
  ATMOSPHERE: "Atmosphere",
  MUSIC: "Music",
  DRINKS: "Drinks",
  VALUE: "Value",
  CROWD: "Crowd",
  SERVICE: "Service",
  CLEANLINESS: "Cleanliness",
};

export default async function VenuePage({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: venue.name,
    address: venue.address,
    geo: { "@type": "GeoCoordinates", latitude: venue.lat, longitude: venue.lng },
    aggregateRating:
      venue.rating.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: venue.rating.overall,
            reviewCount: venue.rating.reviewCount,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="text-sm text-muted">{venue.categoryName ?? "Nightlife venue"}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{venue.name}</h1>
      <p className="mt-2 text-muted">{venue.address}</p>

      <div className="mt-6 flex items-center gap-4">
        <span className="text-2xl font-semibold">
          {venue.rating.reviewCount > 0 ? venue.rating.overall.toFixed(1) : "New"}
        </span>
        <span className="text-muted">
          {venue.rating.reviewCount} {venue.rating.reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>

      {venue.description && <p className="mt-6 leading-relaxed">{venue.description}</p>}

      {venue.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {venue.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {Object.keys(venue.rating.byDimension).length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(venue.rating.byDimension).map(([dimension, score]) => (
            <div key={dimension} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted">{DIMENSION_LABELS[dimension] ?? dimension}</p>
              <p className="mt-1 text-lg font-semibold">{score.toFixed(1)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
