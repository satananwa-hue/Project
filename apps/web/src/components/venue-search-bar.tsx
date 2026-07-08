"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VenueSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(query ? `/venues?query=${encodeURIComponent(query)}` : "/venues");
  }

  return (
    <form onSubmit={handleSubmit} className="pointer-events-auto w-full max-w-sm">
      <input
        type="search"
        placeholder="Search bars, clubs, rooftops…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm shadow-lg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </form>
  );
}
