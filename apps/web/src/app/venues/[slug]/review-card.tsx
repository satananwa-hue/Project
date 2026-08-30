"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReviewAction, claimShareAction } from "./review-actions";

const HEX_CLIP = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';

function LevelAvatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initial = name[0]?.toUpperCase() ?? "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        clipPath: HEX_CLIP,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-accent, #a78bfa)',
            opacity: 0.85,
            fontSize: size * 0.4,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

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
    author: { id: string; name: string; avatarUrl: string | null; level: number };
  };
  slug: string;
  venueName: string;
  venueCategory?: string;
  canDelete: boolean;
  canShare: boolean;
}

export function ReviewCard({ review, slug, venueName, venueCategory, canDelete, canShare }: ReviewCardProps) {
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
    const ogParams = new URLSearchParams({
      venue: venueName,
      rating: String(review.rating),
      ...(venueCategory && { category: venueCategory }),
      text: review.textBody,
      author: review.author.name,
      level: String(review.author.level ?? 1),
    });
    const cardUrl = `${window.location.origin}/api/og?${ogParams.toString()}`;

    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `${venueName.replace(/\s+/g, '-')}-review.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${review.author.name}'s review of ${venueName}`,
        });
        const pts = await claimShareAction(review.id);
        if (pts.ok && pts.points) {
          setShareToast(`+${pts.points} pts earned!`);
          setTimeout(() => setShareToast(null), 3000);
        }
      } else {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(objUrl);
        setShareToast("Card downloaded!");
        setTimeout(() => setShareToast(null), 3000);
        claimShareAction(review.id).catch(() => {});
      }
    } catch {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/venues/${slug}`);
        setShareToast("Link copied!");
        setTimeout(() => setShareToast(null), 2500);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Header: avatar + name/date + stars */}
      <div className="flex items-center gap-3">
        <LevelAvatar name={review.author.name} avatarUrl={review.author.avatarUrl} size={32} />
        <div>
          <p className="text-sm font-medium">{review.author.name}</p>
          <p className="text-xs text-muted">{relativeDate(review.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-0.5 text-sm">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={s <= review.rating ? "text-accent" : "text-border"}>
              ★
            </span>
          ))}
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

      {/* Action row — labelled chip targets per wireframe 1d */}
      {!confirming && (
        <>
          {(canShare || canDelete) ? (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              {shareToast ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <span>✓</span>
                  <span>{shareToast}</span>
                </div>
              ) : (
                <>
                  {canShare && (
                    <button
                      onClick={handleShare}
                      aria-label="Share review"
                      className="flex min-h-[44px] items-center gap-2 rounded-full border border-accent/50 px-4 py-2 text-sm text-accent/80 transition-colors hover:border-accent hover:text-accent"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share card
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDeleteClick}
                      disabled={isPending}
                      aria-label="Delete review"
                      className="ml-auto flex min-h-[44px] items-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400/80 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Signed-out hook */
            <div className="mt-3 border-t border-dashed border-border/60 pt-3">
              <p className="text-xs text-muted">
                <a href="/login" className="underline hover:text-foreground">Sign in</a> to share or review
              </p>
            </div>
          )}
        </>
      )}

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
