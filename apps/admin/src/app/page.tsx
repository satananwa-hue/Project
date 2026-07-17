import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getSessionToken } from "@/lib/session";
import { LogoutButton } from "./logout-button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface Stats {
  accounts: number;
  venues: number;
  reviews: number;
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
          <p className="text-sm text-neutral-400">Signed in as {profile.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Operations dashboard</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Accounts" value={stats?.accounts} />
        <StatCard label="Venues" value={stats?.venues} />
        <StatCard label="Reviews" value={stats?.reviews} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <NavCard
          title="Accounts"
          description="Create and manage creator and administrator accounts."
          href="/accounts"
          linkLabel="Manage accounts"
        />
        <NavCard
          title="Invites"
          description="Generate invite codes for reviewer app sign-up."
          href="/invites"
          linkLabel="Manage invites"
        />
        <NavCard
          title="Venues"
          description="Add new venues or update existing listings."
          href="/venues/new"
          linkLabel="+ New Venue"
        />
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

function NavCard({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-400">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-block rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
