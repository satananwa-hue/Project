import Link from "next/link";
import { Suspense } from "react";
import { getTrendingVenues } from "@/lib/api";
import { VenueCard } from "@/components/venue-card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="flex flex-col items-start gap-4 pb-16">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Bangkok nightlife, reviewed by people who were actually there.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          ChiWitRakMaoChaAoWelaRakKhrai is an invite-only community of reviewers. Anyone can
          discover — only trusted members can contribute.
        </p>
        <Link
          href="/venues"
          className="mt-2 rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground hover:opacity-90"
        >
          Explore venues
        </Link>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Trending in Bangkok</h2>
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingVenues />
        </Suspense>
      </section>

      <section
        id="become-a-reviewer"
        className="mt-24 rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <h2 className="text-2xl font-semibold tracking-tight">Become a Reviewer</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Reviewer accounts are invite-only. Ask a current reviewer for an invite, or follow
          ChiWitRakMaoChaAoWelaRakKhrai for upcoming city launches.
        </p>
      </section>
    </div>
  );
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
