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
    <form onSubmit={handleSubmit} className="pointer-events-auto relative w-full max-w-sm">
      <input
        type="search"
        placeholder="Search bars, clubs, rooftops…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-full border border-border bg-surface py-2.5 pl-4 pr-10 text-sm shadow-lg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </button>
    </form>
  );
}
