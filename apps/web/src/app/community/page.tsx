import type { TopInviterDto } from "@chiwitrakmaochaaowelarakkhrai/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getTopInviters(): Promise<TopInviterDto[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/invites/top-inviters`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return (await res.json()) as TopInviterDto[];
  } catch {
    return [];
  }
}

export default async function CommunityPage() {
  const topInviters = await getTopInviters();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Community</h1>
      <p className="mb-8 text-muted">Reviewers who&apos;ve grown the community the most.</p>

      {topInviters.length === 0 ? (
        <p className="text-muted">No invite activity yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {topInviters.map((inviter, index) => (
            <li
              key={inviter.userId}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted">{index + 1}</span>
                <span className="font-medium">{inviter.displayName}</span>
              </div>
              <span className="text-sm text-muted">{inviter.directInvites} invited</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
