"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "./review-actions";

const STARS = [1, 2, 3, 4, 5] as const;

export function WriteReviewForm({ venueId, slug }: { venueId: string; slug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        Your review has been published. Thank you!
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitReviewAction(venueId, slug, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <h3 className="font-semibold">Write a Review</h3>

      <div className="flex gap-1">
        {STARS.map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            aria-label={`Rate ${s} out of 5`}
            className="text-2xl leading-none transition-transform hover:scale-110"
          >
            {s <= (hover || rating) ? "★" : "☆"}
          </button>
        ))}
        <input type="hidden" name="rating" value={rating} />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Your experience
        <textarea
          name="textBody"
          required
          rows={4}
          placeholder="What was the vibe? Music, crowd, drinks…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-foreground resize-none"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="self-start rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Publishing…" : "Publish Review"}
      </button>
    </form>
  );
}
