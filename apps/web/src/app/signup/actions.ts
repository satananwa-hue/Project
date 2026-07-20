"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import type { AuthSession } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type ActionResult = { ok: true } | { ok: false; error: string };

async function readErrorMessage(res: Response): Promise<string> {
  if (res.status >= 500) return "Service unavailable — please try again later.";
  try {
    const body = (await res.json()) as { message?: string | string[] };
    return Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Something went wrong.");
  } catch {
    return "Something went wrong.";
  }
}

export async function signupAction(
  name: string,
  email: string,
  password: string,
  inviteCode: string,
): Promise<ActionResult> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, inviteCode }),
  });

  if (!res.ok) {
    return { ok: false, error: await readErrorMessage(res) };
  }

  const session = (await res.json()) as AuthSession;
  (await cookies()).set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true };
}
