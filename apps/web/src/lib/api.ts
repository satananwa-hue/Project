import type { VenueDetailDto, VenueListItemDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// A hung fetch (API not deployed yet, cold-starting, network blip) would
// otherwise block Next.js's static generation until it hits its own 60s
// per-page timeout and fails the whole build. Aborting early lets the
// try/catch callers below fall back to empty data instead.
async function apiFetch<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// Backend currently orders by recency, not an actual trending signal (helpful
// votes, view velocity, etc). Real ranking needs enough review volume to exist
// first - tracked as a follow-up once the community has data to rank on.
//
// Falls back to an empty list on failure (API down, build-time prerender before
// the backend is deployed, etc.) rather than crashing the page/build - venue
// discovery should degrade gracefully, not 500.
export async function getTrendingVenues(): Promise<VenueListItemDto[]> {
  try {
    const result = await apiFetch<{ items: VenueListItemDto[] }>("/venues?pageSize=12");
    return result.items;
  } catch {
    return [];
  }
}

export async function searchVenues(query?: string): Promise<VenueListItemDto[]> {
  try {
    const qs = query ? `&query=${encodeURIComponent(query)}` : "";
    const result = await apiFetch<{ items: VenueListItemDto[] }>(`/venues?pageSize=24${qs}`);
    return result.items;
  } catch {
    return [];
  }
}

export async function getVenueBySlug(slug: string): Promise<VenueDetailDto | null> {
  try {
    return await apiFetch<VenueDetailDto>(`/venues/${slug}`);
  } catch {
    return null;
  }
}
