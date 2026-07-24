'use client';

import { useState, useTransition } from 'react';
import { generateInviteCodesAction } from './actions';

export function GenerateButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateInviteCodesAction(5);
      setMessage(result.ok ? `+${result.created} codes generated` : (result.error ?? 'Error'));
      setTimeout(() => setMessage(null), 3000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-sm text-accent">{message}</span>}
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-lg border border-accent/40 px-4 py-2 text-sm text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Generating…' : '+ Generate 5 codes'}
      </button>
    </div>
  );
}
