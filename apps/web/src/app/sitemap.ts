import type { MetadataRoute } from "next";
import { getTrendingVenues } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Pulls the first page of venues (API caps pageSize at 50). Fine while the
// catalog is small; once it grows past a page, this needs a dedicated
// "all slugs" endpoint or a paginated sitemap index instead.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const venues = await getTrendingVenues();

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/venues`, changeFrequency: "daily", priority: 0.8 },
    ...venues.map((venue) => ({
      url: `${siteUrl}/venues/${venue.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
