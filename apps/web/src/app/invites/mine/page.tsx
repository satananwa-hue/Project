import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/session';
import type { InviteDto } from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import { CopyButtons } from './copy-buttons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export default async function MyInvitesPage() {
  const token = await getSessionToken();
  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/invites/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) redirect('/login');

  const invites = (await res.json()) as InviteDto[];
  const remaining = invites.filter((i) => !i.usedAt).length;
  const redeemed = invites.filter((i) => i.usedAt).length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">My Invites</h1>
      <p className="mb-8 text-muted">
        {remaining} remaining · {invites.length} sent · {redeemed} joined
      </p>

      {invites.length === 0 ? (
        <p className="text-muted">You haven&apos;t received any invite codes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {invites.map((invite) => {
            const used = !!invite.usedAt;
            return (
              <li
                key={invite.id}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                  used ? 'border-border bg-surface opacity-50' : 'border-accent/20 bg-surface'
                }`}
              >
                <div>
                  <p className={`font-mono text-sm tracking-widest ${used ? 'line-through text-muted' : 'text-accent'}`}>
                    {invite.code}
                  </p>
                  {used && (
                    <p className="text-xs text-muted mt-0.5">Used {invite.usedAt ? new Date(invite.usedAt).toLocaleDateString() : ''}</p>
                  )}
                </div>
                {used ? (
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">Used</span>
                ) : (
                  <CopyButtons code={invite.code} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
