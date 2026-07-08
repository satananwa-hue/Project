"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import type { AuthSession } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // matches API's JWT_EXPIRES_IN default (7d)

type ActionResult = { ok: true } | { ok: false; error: string };
type RequestOtpResult = { ok: true; devCode?: string } | { ok: false; error: string };

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    return Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Something went wrong.");
  } catch {
    return "Something went wrong.";
  }
}

export async function requestOtpAction(phone: string): Promise<RequestOtpResult> {
  const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    return { ok: false, error: await readErrorMessage(res) };
  }
  // devCode is only ever present when no real SMS provider is configured
  // (local/dev) - never in an environment actually sending SMS.
  const body = (await res.json()) as { devCode?: string };
  return { ok: true, devCode: body.devCode };
}

export async function verifyOtpAction(
  phone: string,
  code: string,
  inviteCode: string | undefined,
): Promise<ActionResult> {
  const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code, inviteCode: inviteCode || undefined }),
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

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
