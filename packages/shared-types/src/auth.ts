import { z } from "zod";

// E.164 format, e.g. +66812345678
const phoneRegex = /^\+[1-9]\d{7,14}$/;

export const requestOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, "Phone number must be in E.164 format, e.g. +66812345678"),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex),
  code: z.string().length(6),
  inviteCode: z.string().optional(),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    displayName: string;
    role: string;
  };
}
