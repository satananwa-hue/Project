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

export async function getSession(): Promise<UserProfile | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

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
