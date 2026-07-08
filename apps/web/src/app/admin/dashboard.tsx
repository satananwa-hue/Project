"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogoutAction } from "./actions";
import type { AdminProfile } from "@/lib/admin-session";

export function AdminDashboard({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await adminLogoutAction();
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Admin portal</p>
          <h1 className="text-3xl font-semibold tracking-tight">Operations dashboard</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {isPending ? "Logging out…" : "Logout"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Signed in as</p>
          <p className="mt-2 text-3xl font-semibold">{profile.username}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Control center</p>
          <p className="mt-2 text-lg font-semibold">Invite, venue, and reviewer controls</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Status</p>
          <p className="mt-2 text-lg font-semibold">Admin session active</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Quick controls</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-full bg-accent px-4 py-2 text-sm text-accent-foreground">
            Reviewer login
          </Link>
          <Link href="/" className="rounded-full border border-border px-4 py-2 text-sm">
            Public site
          </Link>
        </div>
      </div>
    </div>
  );
}
