"use server";

import { getSessionToken } from "@/lib/session";
import type { CreateVenueInput } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ActionResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createVenueAction(input: CreateVenueInput): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Not signed in." };
  }

  const res = await fetch(`${API_BASE_URL}/admin/venues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const error = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Failed to create venue.");
    return { ok: false, error };
  }

  const venue = (await res.json()) as { slug: string };
  return { ok: true, slug: venue.slug };
}
