import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import type { InviteStatsDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default async function MyInvitesPage() {
  const token = await getSessionToken();
  if (!token) redirect("/login");

  const res = await fetch(`${API_BASE_URL}/invites/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) redirect("/login");

  const stats = (await res.json()) as InviteStatsDto;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">My Invites</h1>
      <p className="mb-8 text-muted">
        {stats.remainingInvites} remaining · {stats.totalSent} sent · {stats.totalRedeemed} joined
      </p>

      {stats.invites.length === 0 ? (
        <p className="text-muted">You haven&apos;t sent any invites yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {stats.invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm">{invite.code}</p>
                {invite.invitee && (
                  <p className="text-sm text-muted">Joined as {invite.invitee.displayName}</p>
                )}
              </div>
              <StatusBadge status={invite.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{label}</span>
  );
}
