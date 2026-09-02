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
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null);

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

  function buildOgUrl() {
    const ogParams = new URLSearchParams({
      venue: venueName,
      rating: String(review.rating),
      ...(venueCategory && { category: venueCategory }),
      text: review.textBody,
      author: review.author.name,
      level: String(review.author.level ?? 1),
    });
    return `${window.location.origin}/api/og?${ogParams.toString()}`;
  }

  async function handleShare() {
    // Pre-fetch the card in the background, then open the platform sheet
    setShowShareSheet(true);
    setSharedPlatform(null);
    if (!shareBlob) {
      try {
        const res = await fetch(buildOgUrl());
        const blob = await res.blob();
        setShareBlob(blob);
      } catch { /* sheet still opens, blob stays null */ }
    }
  }

  async function handlePlatformShare(platform: string) {
    setSharedPlatform(platform);
    const venueUrl = `${window.location.origin}/venues/${slug}`;
    const fileName = `${venueName.replace(/\s+/g, '-')}-review.png`;
    const blob = shareBlob;

    function download() {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    }

    try {
      if (platform === 'instagram') {
        download();
      } else if (platform === 'twitter') {
        const text = encodeURIComponent(`${review.author.name}'s review of ${venueName} — ${venueUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
      } else if (platform === 'line') {
        const text = encodeURIComponent(`${venueName} review — ${venueUrl}`);
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(venueUrl)}&text=${text}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(venueUrl)}`, '_blank');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(venueUrl);
      }
    } catch { /* ignore */ }

    claimShareAction(review.id).catch(() => {});

    setTimeout(() => {
      setShowShareSheet(false);
      setSharedPlatform(null);
      setShareToast(platform === 'copy' ? 'Link copied!' : 'Shared!');
      setTimeout(() => setShareToast(null), 2500);
    }, 900);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Header: avatar + name/date + stars */}
      <div className="flex items-center gap-3">
        <LevelAvatar name={review.author.name} avatarUrl={review.author.avatarUrl} size={32} />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium">{review.author.name}</p>
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent/70">Lv.{review.author.level ?? 1}</span>
            {canDelete && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wide">You</span>
            )}
          </div>
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

      {/* Social share platform sheet */}
      {showShareSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1500]"
            onClick={() => setShowShareSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[1600] rounded-t-2xl bg-surface border-t border-border shadow-2xl">
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-border" />
            <div className="px-5 pt-3 pb-8">
              <p className="mb-1 text-center text-sm font-semibold">Share this review</p>
              <p className="mb-5 text-center text-xs text-muted">{venueName}</p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { id: 'instagram', label: 'Instagram', bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  )},
                  { id: 'twitter', label: 'X', bg: 'bg-black border border-white/10', icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.264 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  )},
                  { id: 'line', label: 'LINE', bg: 'bg-[#06C755]', icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                  )},
                  { id: 'facebook', label: 'Facebook', bg: 'bg-[#1877F2]', icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  )},
                  { id: 'copy', label: 'Copy Link', bg: 'bg-surface-raised border border-border', icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  )},
                ].map(({ id, label, bg, icon }) => (
                  <button
                    key={id}
                    onClick={() => handlePlatformShare(id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform active:scale-90 ${bg}`}>
                      {icon}
                      {sharedPlatform === id && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                          <span className="text-lg">✓</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
