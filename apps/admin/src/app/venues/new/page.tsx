import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { VenueForm } from "./venue-form";
import type { VenueCategoryDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getCategories(): Promise<VenueCategoryDto[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/venues/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as VenueCategoryDto[];
  } catch {
    return [];
  }
}

export default async function NewVenuePage() {
  const profile = await getSession();
  if (!profile) redirect("/login");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">New Venue</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Cities are fixed to Bangkok for now - see the comment in venue-form.tsx if that changes.
      </p>
      <VenueForm categories={categories} />
    </div>
  );
}
