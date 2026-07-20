"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/app/login/actions";
import { REPUTATION_LEVELS } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import type { UserProfile } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

export function ReviewerSidebar({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const levelName = REPUTATION_LEVELS[profile.reputationLevel] ?? REPUTATION_LEVELS[0];

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-full w-64 flex-col border-l border-border bg-surface p-5">
      <div className="mb-6">
        <p className="font-medium">{profile.displayName}</p>
        <p className="text-xs text-accent">{levelName}</p>
        <p className="mt-1 text-xs text-muted">{profile.points} pts</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 text-sm">
        <SidebarLink href="/reviews/new">+ Write Review</SidebarLink>
        <SidebarLink href="/reviews/mine" disabled>
          My Reviews
        </SidebarLink>
        <SidebarLink href="/invites/mine">My Invites</SidebarLink>
        <SidebarLink href="/notifications" disabled>
          Notifications
        </SidebarLink>
        <SidebarLink href="/community">Community</SidebarLink>
      </nav>
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-raised hover:text-foreground disabled:opacity-50"
      >
        {isPending ? "Logging out…" : "Logout"}
      </button>
    </aside>
  );
}

function SidebarLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg px-3 py-2 text-muted/60" title="Coming soon">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className="rounded-lg px-3 py-2 hover:bg-surface-raised">
      {children}
    </Link>
  );
}
