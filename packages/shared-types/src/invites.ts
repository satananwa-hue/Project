import { z } from 'zod';

export const createInviteSchema = z.object({
  note: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional(),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const bulkCreateInviteSchema = z.object({
  count: z.number().int().min(1).max(1000),
});
export type BulkCreateInviteInput = z.infer<typeof bulkCreateInviteSchema>;

export interface InviteDto {
  id: string;
  code: string;
  note: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  usedByAccountId: string | null;
  ownedByAccountId: string | null;
  createdAt: string;
}

export interface TopInviterDto {
  userId: string;
  displayName: string;
  directInvites: number;
}
