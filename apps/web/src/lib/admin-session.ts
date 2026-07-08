import "server-only";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "nc_admin_session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface AdminProfile {
  id: string;
  username: string;
  role: string;
}

export async function getAdminSessionToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function getAdminSession(): Promise<AdminProfile | null> {
  const token = await getAdminSessionToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminProfile;
  } catch {
    return null;
  }
}
