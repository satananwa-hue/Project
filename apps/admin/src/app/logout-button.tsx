"use client";

import { useTransition } from "react";
import { logoutAction } from "./login/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className="rounded-full border border-neutral-700 px-4 py-2 text-sm disabled:opacity-50"
    >
      {isPending ? "Logging out…" : "Logout"}
    </button>
  );
}
