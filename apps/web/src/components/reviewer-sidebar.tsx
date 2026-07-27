"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { REPUTATION_LEVELS } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import type { UserProfile } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const THRESHOLDS = [0, 15, 75, 250, 500];

function levelProgress(points: number, level: number) {
  const cur = THRESHOLDS[level - 1] ?? 0;
  const nxt = THRESHOLDS[level];
  if (!nxt) return { pct: 100, ptsToNext: 0, nextTitle: null };
  return {
    pct: Math.min(100, ((points - cur) / (nxt - cur)) * 100),
    ptsToNext: nxt - points,
    nextTitle: REPUTATION_LEVELS[level + 1] ?? null,
  };
}

interface InviteRow {
  id: string;
  code: string;
  usedAt: string | null;
}

// Tiny trigger for the mobile bottom-nav — must be a Client Component so onClick works
export function MobileProfileTrigger({ children }: { children: React.ReactNode }) {
  function open() {
    window.dispatchEvent(new CustomEvent("open-profile-sheet"));
  }
  return (
    <button
      onClick={open}
      className="flex flex-col items-center gap-0.5 text-muted hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

// Button rendered inside the header nav — outside Leaflet's event scope
export function ProfileAvatarButton({
  level,
  levelName,
  displayName,
}: {
  level: number;
  levelName: string;
  displayName?: string;
}) {
  function open() {
    window.dispatchEvent(new CustomEvent("open-profile-sheet"));
  }
  return (
    <button
      onClick={open}
      aria-label="Open profile"
      className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface/60 px-2 py-1 hover:border-accent/60 hover:bg-surface transition-colors shadow-sm"
    >
      <div className="h-7 w-7 overflow-hidden rounded-full border border-accent/50 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/levels/level_${level}.png`} alt={levelName} className="h-full w-full object-cover" />
      </div>
      {displayName && (
        <span className="text-xs font-semibold text-foreground/90 pr-1 max-w-[120px] truncate hidden sm:block">
          {displayName}
        </span>
      )}
    </button>
  );
}

// Sheet rendered at root — listens for CustomEvent to open
export function ReviewerProfileSheet({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<InviteRow[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const level = profile.reputationLevel;
  const levelName = REPUTATION_LEVELS[level] ?? "New Explorer";
  const { pct, ptsToNext, nextTitle } = levelProgress(profile.points, level);
  const isAdmin = profile.role === "ADMINISTRATOR";

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-profile-sheet", handler);
    return () => window.removeEventListener("open-profile-sheet", handler);
  }, []);

  useEffect(() => {
    if (open && invites === null) {
      fetch("/api/invites/mine")
        .then((r) => r.json())
        .then((d: InviteRow[]) => setInvites(d))
        .catch(() => setInvites([]));
    }
  }, [open, invites]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      setOpen(false);
      router.push("/");
      router.refresh();
    });
  }

  const unused = invites?.filter((i) => !i.usedAt) ?? [];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 1500 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-surface border-t border-border shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ zIndex: 1600 }}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-border" />

        <div className="px-5 pb-10 pt-4">
          {/* Avatar + identity */}
          <div className="flex flex-col items-center gap-3 border-b border-border pb-5">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-accent/40 bg-surface-raised">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/levels/level_${level}.png`} alt={levelName} className="h-full w-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{profile.displayName}</p>
              <p className="text-sm text-muted">{profile.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="rounded-full border border-accent/40 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                {profile.role}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-border px-3 py-0.5 text-xs text-muted">
                ★ {profile.points} pts
              </span>
            </div>
          </div>

          {/* Level card */}
          <div className="mt-4 rounded-2xl bg-surface-raised p-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-accent/30 bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/levels/level_${level}.png`} alt={levelName} className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="inline-block rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                  Lv.{level}
                </span>
                <p className="mt-0.5 font-semibold">{levelName}</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            {nextTitle ? (
              <p className="mt-1.5 text-xs text-muted">{ptsToNext} pts to {nextTitle}</p>
            ) : (
              <p className="mt-1.5 text-xs text-accent font-medium">Max level reached</p>
            )}
          </div>

          {/* Invite codes */}
          {unused.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted">
                🗝️ Invite Codes
              </p>
              <ul className="flex flex-col gap-2">
                {unused.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between rounded-xl bg-surface-raised px-4 py-3">
                    <span className="font-mono text-sm tracking-widest text-accent">{invite.code}</span>
                    <button
                      onClick={() => copy(invite.code, invite.id)}
                      className="rounded-lg border border-accent/40 px-3 py-1 text-xs text-accent hover:bg-accent/10 transition-colors"
                    >
                      {copied === invite.id ? "✓ Copied" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin panel */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-surface-raised transition-colors"
            >
              <span>🛡️</span><span>Admin Panel</span>
            </Link>
          )}

          {/* Nav links */}
          <div className="mt-1 flex flex-col">
            <Link href="/reviews/new" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-surface-raised transition-colors">
              <span>✏️</span><span>Write Review</span>
            </Link>
            <Link href="/invites/mine" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-surface-raised transition-colors">
              <span>📨</span><span>My Invites</span>
            </Link>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted hover:bg-surface-raised transition-colors disabled:opacity-50"
          >
            <span>↩</span><span>{isPending ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
