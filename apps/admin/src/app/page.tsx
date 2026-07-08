import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getSessionToken } from "@/lib/session";
import { LogoutButton } from "./logout-button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface Stats {
  reviewers: number;
  invites: number;
  venues: number;
}

async function getStats(token: string): Promise<Stats | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Stats;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const profile = await getSession();
  if (!profile) redirect("/login");

  const token = await getSessionToken();
  const stats = token ? await getStats(token) : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-400">Signed in as {profile.username}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Operations dashboard</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Reviewers" value={stats?.reviewers} />
        <StatCard label="Invites sent" value={stats?.invites} />
        <StatCard label="Venues" value={stats?.venues} />
      </div>

      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-lg font-semibold">Content</h2>
        <p className="mt-1 text-sm text-neutral-400">
          There&apos;s no venue listing/edit view yet - only creation. Editing an existing venue
          currently needs its ID via <code>PATCH /api/admin/venues/:id</code> directly.
        </p>
        <Link
          href="/venues/new"
          className="mt-4 inline-block rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black"
        >
          + New Venue
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value ?? "—"}</p>
    </div>
  );
}
