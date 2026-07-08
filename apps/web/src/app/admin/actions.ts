"use server";

import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // matches API's JWT_EXPIRES_IN default (7d)

type ActionResult = { ok: true } | { ok: false; error: string };

export async function adminLoginAction(username: string, password: string): Promise<ActionResult> {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message ?? "Login failed" };
  }

  const data = (await res.json()) as { accessToken: string };
  (await cookies()).set(ADMIN_SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true };
}

export async function adminLogoutAction(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
