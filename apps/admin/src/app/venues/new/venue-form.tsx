"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVenueAction } from "./actions";

const CATEGORIES = ["BAR", "CLUB", "ROOFTOP", "LIVE_MUSIC", "LOUNGE", "OTHER"] as const;
const PRICE_RANGES = ["BUDGET", "MODERATE", "UPSCALE", "LUXURY"] as const;

export function VenueForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(e.currentTarget);

    const musicGenres = String(form.get("musicGenres") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const crowdTypes = String(form.get("crowdTypes") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const photos = String(form.get("photos") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await createVenueAction({
        name: String(form.get("name") ?? ""),
        category: (String(form.get("category") || "OTHER")) as (typeof CATEGORIES)[number],
        address: String(form.get("address") ?? ""),
        lat: Number(form.get("lat")),
        lng: Number(form.get("lng")),
        city: String(form.get("city") || "Bangkok"),
        coverCharge: form.get("coverCharge") ? Number(form.get("coverCharge")) : null,
        musicGenres,
        crowdTypes,
        priceRange: (form.get("priceRange") as (typeof PRICE_RANGES)[number]) || null,
        photos,
        isPublished: form.get("isPublished") === "on",
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Created "${result.name}" (${result.id})`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <Field label="Name" name="name" required />

      <label className="flex flex-col gap-1 text-sm">
        Category
        <select name="category" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <Field label="Address" name="address" required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude" name="lat" type="number" step="any" required />
        <Field label="Longitude" name="lng" type="number" step="any" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" name="city" placeholder="Bangkok" />
        <Field label="Cover charge (THB)" name="coverCharge" type="number" min={0} />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Price range
        <select name="priceRange" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2">
          <option value="">— none —</option>
          {PRICE_RANGES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>

      <Field
        label="Music genres (comma-separated)"
        name="musicGenres"
        placeholder="House, Techno, Hip-hop"
      />
      <Field
        label="Crowd types (comma-separated)"
        name="crowdTypes"
        placeholder="Expats, Locals, Students"
      />

      <label className="flex flex-col gap-1 text-sm">
        Photo URLs (one per line)
        <textarea
          name="photos"
          rows={3}
          placeholder="https://cdn.example.com/venue1.jpg"
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublished" className="rounded" />
        Publish immediately
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
