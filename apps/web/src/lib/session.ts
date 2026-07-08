import "server-only";
import { cookies } from "next/headers";
import type { UserProfile } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

export const SESSION_COOKIE = "nc_session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

// The cookie value is the JWT our NestJS API already issues and signs - no
// separate session-encryption layer needed, since that token is already
// tamper-proof and the API is the source of truth for verifying it.
export async function getSession(): Promise<UserProfile | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as UserProfile;
  } catch {
    return null;
  }
}
