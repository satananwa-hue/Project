import { z } from 'zod';

export const venueSearchSchema = z.object({
  query: z.string().optional(),
  category: z.enum(['BAR', 'CLUB', 'ROOFTOP', 'LIVE_MUSIC', 'LOUNGE', 'OTHER']).optional(),
  priceRange: z.enum(['BUDGET', 'MODERATE', 'UPSCALE', 'LUXURY']).optional(),
  musicGenre: z.string().optional(),
  crowdType: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusM: z.coerce.number().positive().max(30000).default(10000),
  publishedOnly: z.coerce.boolean().default(true),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(5000).default(20),
});
export type VenueSearchInput = z.infer<typeof venueSearchSchema>;

export const createVenueSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(['BAR', 'CLUB', 'ROOFTOP', 'LIVE_MUSIC', 'LOUNGE', 'OTHER']).default('OTHER'),
  address: z.string().min(1).max(300),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  city: z.string().default('Bangkok'),
  coverCharge: z.coerce.number().int().nonnegative().nullable().optional(),
  musicGenres: z.array(z.string()).default([]),
  crowdTypes: z.array(z.string()).default([]),
  priceRange: z.enum(['BUDGET', 'MODERATE', 'UPSCALE', 'LUXURY']).nullable().optional(),
  hoursJson: z.record(z.string()).nullable().optional(),
  photos: z.array(z.string().url()).default([]),
  isPublished: z.boolean().default(false),
});
export type CreateVenueInput = z.infer<typeof createVenueSchema>;

export const updateVenueSchema = createVenueSchema.partial();
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

export interface VenueListItemDto {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
  coverCharge: number | null;
  musicGenres: string[];
  crowdTypes: string[];
  priceRange: string | null;
  photos: string[];
  isPublished: boolean;
  topRating: number | null;
  reviewCount: number;
  distanceM: number | null;
}

export interface VenueDetailDto extends VenueListItemDto {
  hoursJson: Record<string, string> | null;
  createdById: string;
  createdByName: string;
  lastEditedById: string;
  lastEditedByName: string;
  createdAt: string;
  updatedAt: string;
  reviews: ReviewSummaryDto[];
}

export interface ReviewSummaryDto {
  id: string;
  rating: number;
  textBody: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}
