import "server-only";
import { cookies } from "next/headers";
import type { AccountDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import { getReputationLevel } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import type { UserProfile } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

export const SESSION_COOKIE = "nc_session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Decode JWT locally — no API call, never times out. Returns user id or null. */
export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    const json = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(json) as { sub?: string; exp?: number };
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserProfile | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("session_timeout")), 5000),
    );
    const fetchPromise = fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const res = await Promise.race([fetchPromise, timeoutPromise]);

    if (!res.ok) return null;
    const dto = (await res.json()) as AccountDto;
    return {
      id: dto.id,
      displayName: dto.name,
      email: dto.email,
      avatarUrl: dto.avatarUrl,
      role: dto.role,
      points: dto.points,
      reputationLevel: getReputationLevel(dto.points),
    };
  } catch {
    // Timeout or network error — render page as guest rather than crash
    return null;
  }
}
