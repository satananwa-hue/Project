"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitReviewAction(
  venueId: string,
  slug: string,
  formData: FormData,
): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: "You must be logged in to post a review." };

  const rating = Number(formData.get("rating"));
  const textBody = String(formData.get("textBody") ?? "").trim();

  if (!rating || rating < 1 || rating > 5) {
    return { ok: false, error: "Please select a rating from 1 to 5." };
  }
  if (!textBody) {
    return { ok: false, error: "Review text is required." };
  }

  const res = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      venueId,
      rating,
      textBody,
      isPublished: true,
    }),
  });

  if (!res.ok) {
    try {
      const body = (await res.json()) as { message?: string | string[] };
      const msg = Array.isArray(body.message)
        ? body.message.join(", ")
        : (body.message ?? "Something went wrong.");
      return { ok: false, error: msg };
    } catch {
      return { ok: false, error: "Something went wrong." };
    }
  }

  revalidatePath(`/venues/${slug}`);
  return { ok: true };
}
