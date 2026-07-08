"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOtpAction, verifyOtpAction } from "./actions";

type Step = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction(phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep("code");
    });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(phone, code, inviteCode);
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
      <h1 className="text-2xl font-semibold tracking-tight">Reviewer Login</h1>
      <p className="mt-2 text-sm text-muted">
        {step === "phone"
          ? "Enter your phone number to continue. Have an invite code? Add it below to become a reviewer."
          : `Enter the code we sent to ${phone}.`}
      </p>

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Phone number
            <input
              type="tel"
              required
              placeholder="+66812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Invite code <span className="text-muted">(optional, only for new reviewers)</span>
            <input
              type="text"
              placeholder="ABC123XY"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-accent px-6 py-2.5 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Sending code…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            6-digit code
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground tracking-widest"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-accent px-6 py-2.5 font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Verifying…" : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-sm text-muted hover:text-foreground"
          >
            Use a different number
          </button>
        </form>
      )}
    </div>
  );
}
