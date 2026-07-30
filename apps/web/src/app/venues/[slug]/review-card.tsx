"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReviewAction, claimShareAction } from "./review-actions";

function formatTag(tag: string): string {
  const parts = tag.split("-");
  if (parts.length === 2) {
    const cat = parts[0][0].toUpperCase() + parts[0].slice(1);
    const n = parseInt(parts[1], 10);
    if (!isNaN(n)) return `${cat} ${"★".repeat(n)}${"☆".repeat(5 - n)}`;
  }
  return tag;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 365) return `${Math.floor(days / 365)}y ago`;
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    textBody: string;
    tags: string[];
    createdAt: string;
    author: { id: string; name: string; avatarUrl: string | null };
  };
  slug: string;
  venueName: string;
  canDelete: boolean;
}

export function ReviewCard({ review, slug, venueName, canDelete }: ReviewCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  function handleDeleteClick() {
    setConfirming(true);
  }

  function handleCancelDelete() {
    setConfirming(false);
    setError(null);
  }

  function handleConfirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteReviewAction(review.id, slug);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}/venues/${slug}`;
    const shareText = `${review.author.name} rated ${venueName} ${review.rating}/5 on NightCheck`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${venueName} — NightCheck`, text: shareText, url });
        // Claim points after successful share
        const res = await claimShareAction(review.id);
        if (res.ok && res.points) {
          setShareToast(`+${res.points} pts earned!`);
          setTimeout(() => setShareToast(null), 3000);
        }
      } catch {
        // User cancelled share — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast("Link copied!");
      setTimeout(() => setShareToast(null), 2500);
      // Claim points on copy too
      claimShareAction(review.id).catch(() => {});
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {review.author.avatarUrl ? (
          <img
            src={review.author.avatarUrl}
            alt={review.author.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            {review.author.name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{review.author.name}</p>
          <p className="text-xs text-muted">{relativeDate(review.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-sm">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= review.rating ? "text-accent" : "text-border"}>
                ★
              </span>
            ))}
          </div>

          {/* Share button — shown on all cards */}
          {!confirming && (
            <button
              onClick={handleShare}
              aria-label="Share review"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-muted/40 transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}

          {/* Delete button — only for own reviews */}
          {canDelete && !confirming && (
            <button
              onClick={handleDeleteClick}
              disabled={isPending}
              aria-label="Delete review"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted/40 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            >
              {isPending ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {review.textBody && (
        <p className="mt-3 text-sm leading-relaxed">{review.textBody}</p>
      )}
      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.tags.map((tag: string) => (
            <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent/80">
              {formatTag(tag)}
            </span>
          ))}
        </div>
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-accent">
          <span>✓</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Inline delete confirm */}
      {confirming && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          <span className="flex-1 text-red-400">Delete this review?</span>
          <button
            onClick={handleCancelDelete}
            disabled={isPending}
            className="rounded px-2 py-1 text-xs text-muted hover:text-foreground disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-40"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
