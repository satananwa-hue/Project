'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-bold">Admin panel failed to load</h2>
      <p className="text-sm text-muted max-w-sm">
        {error.message ?? 'Could not reach the API. The server may be waking up — try again in a few seconds.'}
      </p>
      <button
        onClick={reset}
        className="mt-2 px-5 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
