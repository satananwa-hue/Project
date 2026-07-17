import { z } from 'zod';
import type { AccountRole } from './enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  inviteCode: z.string().min(1),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['CREATOR', 'ADMINISTRATOR']).default('CREATOR'),
  avatarUrl: z.string().url().optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.enum(['CREATOR', 'ADMINISTRATOR']).optional(),
  active: z.boolean().optional(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface AccountDto {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: AccountRole;
  active: boolean;
  points: number;
  createdAt: string;
  lastLoginAt: string | null;
  createdBy: { id: string; name: string } | null;
}

export interface AuthSession {
  accessToken: string;
  account: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: AccountRole;
    points: number;
  };
}
