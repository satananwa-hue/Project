import { z } from 'zod';

export const createReviewSchema = z.object({
  venueId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  textBody: z.string().min(1).max(5000),
  media: z.array(z.object({ url: z.string().url(), type: z.enum(['photo', 'video']) })).default([]),
  tags: z.array(z.string()).default([]),
  musicGenreNotes: z.string().max(500).nullable().optional(),
  priceLevelNotes: z.string().max(500).nullable().optional(),
  crowdNotes: z.string().max(500).nullable().optional(),
  isPublished: z.boolean().default(false),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.omit({ venueId: true }).partial();
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export interface ReviewDetailDto {
  id: string;
  venueId: string;
  venueName: string;
  rating: number;
  textBody: string;
  media: { url: string; type: 'photo' | 'video' }[];
  tags: string[];
  musicGenreNotes: string | null;
  priceLevelNotes: string | null;
  crowdNotes: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}
