'use client';
import { useState, useTransition, useRef } from 'react';
import type { AccountDto, InviteDto } from '@chiwitrakmaochaaowelarakkhrai/shared-types';
import {
  updateAccountRole,
  toggleAccountActive,
  adminResetPassword,
  createInvite,
  bulkCreateInvites,
  revokeInvite,
} from './actions';

interface Stats {
  accounts: number;
  venues: number;
  reviews: number;
  publishedVenues: number;
  pendingVenues: number;
}

interface Props {
  stats: Stats;
  accounts: AccountDto[];
  invites: InviteDto[];
  currentUserId: string;
}

type Tab = 'overview' | 'users' | 'invites';

const ROLE_LABELS: Record<string, string> = {
  USER: 'User',
  CREATOR: 'Creator',
  ADMINISTRATOR: 'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  USER: 'text-muted border-border/50',
  CREATOR: 'text-[#10B981] border-[#10B981]/30',
  ADMINISTRATOR: 'text-accent border-accent/30',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5 flex flex-col gap-1">
      <span className="text-xs font-bold tracking-widest uppercase text-muted">{label}</span>
      <span className="text-3xl font-bold tabular-nums text-foreground">{value.toLocaleString()}</span>
      {sub && <span className="text-xs text-muted/70">{sub}</span>}
    </div>
  );
}

function PasswordModal({ account, onClose }: { account: AccountDto; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [busy, startT] = useTransition();
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return;
    startT(async () => {
      await adminResetPassword(account.id, pw);
      setDone(true);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-border/40 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-1">Reset Password</h3>
        <p className="text-xs text-muted mb-4">{account.name} · {account.email}</p>
        {done ? (
          <div className="text-sm text-[#10B981] font-medium py-2">Password updated.</div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted hover:text-foreground transition-colors">Cancel</button>
              <button
                type="submit"
                disabled={pw.length < 8 || busy}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent/90 transition-colors"
              >
                {busy ? 'Saving…' : 'Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function UsersTab({ accounts, currentUserId }: { accounts: AccountDto[]; currentUserId: string }) {
  const [query, setQuery] = useState('');
  const [resetTarget, setResetTarget] = useState<AccountDto | null>(null);
  const [, startT] = useTransition();

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.email.toLowerCase().includes(query.toLowerCase()),
  );

  function changeRole(account: AccountDto, role: 'CREATOR' | 'ADMINISTRATOR') {
    startT(() => updateAccountRole(account.id, role));
  }

  function toggleActive(account: AccountDto) {
    startT(() => toggleAccountActive(account.id, !account.active));
  }

  return (
    <div className="flex flex-col gap-4">
      {resetTarget && (
        <PasswordModal account={resetTarget} onClose={() => setResetTarget(null)} />
      )}

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 max-w-xs rounded-lg border border-border/40 bg-surface px-3 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">{filtered.length} of {accounts.length}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-surface/60">
              {['Name', 'Email', 'Role', 'Points', 'Status', 'Last login', 'Created', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((acc) => (
              <tr key={acc.id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  {acc.name}
                  {acc.id === currentUserId && <span className="ml-2 text-[10px] font-bold text-accent/70 uppercase tracking-wide">(you)</span>}
                </td>
                <td className="px-4 py-3 text-muted text-xs font-mono">{acc.email}</td>
                <td className="px-4 py-3">
                  {acc.id === currentUserId ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ROLE_COLORS[acc.role] ?? ''}`}>
                      {ROLE_LABELS[acc.role] ?? acc.role}
                    </span>
                  ) : (
                    <select
                      defaultValue={acc.role === 'USER' ? '' : acc.role}
                      onChange={(e) => {
                        const val = e.target.value as 'CREATOR' | 'ADMINISTRATOR';
                        if (val) changeRole(acc, val);
                      }}
                      className="rounded-lg border border-border/40 bg-background px-2 py-1 text-xs focus:outline-none focus:border-accent cursor-pointer"
                    >
                      {acc.role === 'USER' && <option value="" disabled>User</option>}
                      <option value="CREATOR">Creator</option>
                      <option value="ADMINISTRATOR">Admin</option>
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{acc.points}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(acc)}
                    disabled={acc.id === currentUserId}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      acc.active
                        ? 'text-[#10B981] border-[#10B981]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30'
                        : 'text-red-400 border-red-400/30 hover:bg-[#10B981]/10 hover:text-[#10B981] hover:border-[#10B981]/30'
                    }`}
                  >
                    {acc.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">{fmt(acc.lastLoginAt)}</td>
                <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">{fmt(acc.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => setResetTarget(acc)}
                    className="text-xs text-muted hover:text-accent transition-colors font-medium"
                  >
                    Reset PW
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No accounts match.</p>
        )}
      </div>
    </div>
  );
}

function InvitesTab({ invites }: { invites: InviteDto[] }) {
  const [note, setNote] = useState('');
  const [bulk, setBulk] = useState('5');
  const [busy, startT] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleCreate() {
    startT(async () => {
      await createInvite(note || undefined);
      setNote('');
    });
  }

  function handleBulk() {
    const n = parseInt(bulk, 10);
    if (!n || n < 1) return;
    startT(() => bulkCreateInvites(n));
  }

  function handleRevoke(code: string) {
    startT(() => revokeInvite(code));
  }

  const unused = invites.filter((i) => !i.usedAt).length;
  const used = invites.filter((i) => !!i.usedAt).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Actions row */}
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-border/30 bg-surface/40">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Create invite</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Optional note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm w-48 placeholder:text-muted/50 focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold uppercase tracking-wide disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {busy ? '…' : 'Create'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Bulk generate</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={1000}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm w-20 focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleBulk}
              disabled={busy}
              className="px-4 py-2 rounded-lg border border-accent/40 text-accent text-xs font-bold uppercase tracking-wide disabled:opacity-50 hover:bg-accent/10 transition-colors"
            >
              {busy ? '…' : 'Generate'}
            </button>
          </div>
        </div>

        <div className="ml-auto flex gap-4 text-xs text-muted pt-1">
          <span><b className="text-foreground tabular-nums">{unused}</b> available</span>
          <span><b className="text-foreground tabular-nums">{used}</b> used</span>
        </div>
      </div>

      {/* Invite table */}
      <div className="overflow-x-auto rounded-xl border border-border/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-surface/60">
              {['Code', 'Note', 'Created', 'Expires', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv.id} className={`border-b border-border/20 transition-colors ${inv.usedAt ? 'opacity-50' : 'hover:bg-surface/40'}`}>
                <td className="px-4 py-3 font-mono text-xs tracking-wider text-accent">
                  <button onClick={() => copyCode(inv.code)} className="hover:underline">
                    {inv.code}
                  </button>
                  {copied === inv.code && <span className="ml-2 text-[#10B981] text-[10px] font-bold">Copied!</span>}
                </td>
                <td className="px-4 py-3 text-muted text-xs">{inv.note ?? '—'}</td>
                <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">{fmt(inv.createdAt)}</td>
                <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">{fmt(inv.expiresAt)}</td>
                <td className="px-4 py-3 text-xs">
                  {inv.usedAt ? (
                    <span className="text-muted font-medium">Used {fmt(inv.usedAt)}</span>
                  ) : (
                    <span className="text-[#10B981] font-bold">Available</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!inv.usedAt && (
                    <button
                      onClick={() => handleRevoke(inv.code)}
                      disabled={busy}
                      className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-medium"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invites.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No invites yet.</p>
        )}
      </div>
    </div>
  );
}

export function AdminClient({ stats, accounts, invites, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: `Users (${accounts.length})` },
    { id: 'invites', label: `Invites (${invites.length})` },
  ];

  return (
    <div className="min-h-full flex flex-col">
      {/* Page header */}
      <div className="border-b border-border/30 bg-surface/30 px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-xs text-muted mt-0.5">Manage accounts, invites and platform stats.</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border/30 px-6 flex gap-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total users" value={stats.accounts} />
            <StatCard label="Total venues" value={stats.venues} sub={`${stats.pendingVenues} pending`} />
            <StatCard label="Published" value={stats.publishedVenues} />
            <StatCard label="Reviews" value={stats.reviews} />
            <StatCard label="Invites sent" value={invites.length} sub={`${invites.filter((i) => !i.usedAt).length} available`} />
          </div>
        )}
        {tab === 'users' && <UsersTab accounts={accounts} currentUserId={currentUserId} />}
        {tab === 'invites' && <InvitesTab invites={invites} />}
      </div>
    </div>
  );
}
