import { z } from "zod";
import { RatingDimension } from "./enums";

export const venueSearchSchema = z.object({
  cityId: z.string().optional(),
  query: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusM: z.coerce.number().positive().max(20000).default(3000),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});
export type VenueSearchInput = z.infer<typeof venueSearchSchema>;

export interface VenueRatingSummary {
  overall: number;
  reviewCount: number;
  byDimension: Partial<Record<RatingDimension, number>>;
}

export interface VenueListItemDto {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  lat: number;
  lng: number;
  priceRange: number | null;
  distanceM: number | null;
  rating: VenueRatingSummary;
  coverPhotoUrl: string | null;
  // Admin-set, distinct from `rating` (which is the community's aggregate).
  // Populated when there's no reviewer-driven rating yet - e.g. the
  // discovery-only mobile app, which has no reviewer accounts at all.
  curatedRating: number | null;
}

export interface VenueDetailDto extends VenueListItemDto {
  description: string | null;
  address: string;
  tags: string[];
  status: "ACTIVE" | "PENDING" | "CLOSED";
  curatedReview: string | null;
}

export interface VenueCategoryDto {
  id: string;
  name: string;
}

// Admin-only mutations (venue creation/editing) - the read-side schemas above
// are consumed by both the website and the discovery app; these are not.
export const createVenueSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
    .optional(),
  cityId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  address: z.string().min(1).max(300),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  priceRange: z.coerce.number().int().min(1).max(4).optional(),
  description: z.string().max(2000).optional(),
  curatedRating: z.coerce.number().min(0).max(5).optional(),
  curatedReview: z.string().max(2000).optional(),
});
export type CreateVenueInput = z.infer<typeof createVenueSchema>;

export const updateVenueSchema = createVenueSchema.partial().extend({
  status: z.enum(['ACTIVE', 'PENDING', 'CLOSED']).optional(),
});
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
