"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVenueAction } from "./actions";
import type { VenueCategoryDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

// Bangkok is the only city in the MVP (seed-venues.ts uses the same id) - not
// worth a city picker until a second city actually launches.
const DEFAULT_CITY_ID = "bangkok";

export function VenueForm({ categories }: { categories: VenueCategoryDto[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createVenueAction({
        name: String(form.get("name") ?? ""),
        slug: form.get("slug") ? String(form.get("slug")) : undefined,
        cityId: DEFAULT_CITY_ID,
        categoryId: form.get("categoryId") ? String(form.get("categoryId")) : undefined,
        address: String(form.get("address") ?? ""),
        lat: Number(form.get("lat")),
        lng: Number(form.get("lng")),
        priceRange: form.get("priceRange") ? Number(form.get("priceRange")) : undefined,
        description: form.get("description") ? String(form.get("description")) : undefined,
        curatedRating: form.get("curatedRating") ? Number(form.get("curatedRating")) : undefined,
        curatedReview: form.get("curatedReview") ? String(form.get("curatedReview")) : undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Created "${result.slug}".`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <Field label="Name" name="name" required />
      <Field label="Slug" name="slug" placeholder="auto-generated from name if left blank" />

      <label className="flex flex-col gap-1 text-sm">
        Category
        <select name="categoryId" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2">
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <Field label="Address" name="address" required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude" name="lat" type="number" step="any" required />
        <Field label="Longitude" name="lng" type="number" step="any" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price range (1-4)" name="priceRange" type="number" min={1} max={4} />
        <Field label="Curated rating (0-5)" name="curatedRating" type="number" step="0.1" min={0} max={5} />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          name="description"
          rows={3}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Curated review (shown on the venue page)
        <textarea
          name="curatedReview"
          rows={3}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-full bg-amber-500 px-6 py-2.5 font-medium text-black disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create venue"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
      />
    </label>
  );
}
