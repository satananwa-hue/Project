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

/** True if the session cookie exists — used to gate UI-only actions like share. */
export async function hasSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return !!token;
}

/** Decode JWT locally — no API call, never times out. Returns user id or null. */
export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    // Use standard base64 decode (replace base64url chars) for max compatibility
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export interface SessionNavData {
  id: string;
  role: string;
  name: string;
}

/** Decode JWT locally — no API call. Returns id, role, name for nav rendering. */
export async function getSessionNavData(): Promise<SessionNavData | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as { sub?: unknown; role?: unknown; name?: unknown };
    if (typeof payload.sub !== 'string') return null;
    return {
      id: payload.sub,
      role: typeof payload.role === 'string' ? payload.role : 'USER',
      name: typeof payload.name === 'string' ? payload.name : '',
    };
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
