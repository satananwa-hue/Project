import { z } from "zod";

export const createInviteSchema = z.object({});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export interface InviteDto {
  id: string;
  code: string;
  status: "PENDING" | "USED" | "EXPIRED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  invitee: { id: string; displayName: string } | null;
}

export interface InviteStatsDto {
  remainingInvites: number;
  totalSent: number;
  totalRedeemed: number;
  invites: InviteDto[];
}

export interface TopInviterDto {
  userId: string;
  displayName: string;
  directInvites: number;
  subtreeSize: number;
}
