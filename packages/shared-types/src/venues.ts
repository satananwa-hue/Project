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
}

export interface VenueDetailDto extends VenueListItemDto {
  description: string | null;
  address: string;
  tags: string[];
  status: "ACTIVE" | "PENDING" | "CLOSED";
}
