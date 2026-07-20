"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signupAction(name, email, password, inviteCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
      <p className="mt-2 text-sm text-muted">
        You need an invite code to join. Once you have one, create your reviewer account below.
      </p>

      <form onSubmit={handleSignup} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Your name
          <input
            type="text"
            required
            autoComplete="name"
            placeholder="Bangkok Nightlifer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password <span className="text-muted">(min 8 chars)</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Invite code
          <input
            type="text"
            required
            placeholder="ABC123XY"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground font-mono"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-full bg-accent px-6 py-2.5 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Creating account…" : "Create Account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <a href="/login" className="underline hover:text-foreground">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
