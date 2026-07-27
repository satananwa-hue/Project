'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#101415', color: '#e0e3e5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Something went wrong</h2>
        <p style={{ color: '#9a9aa5', fontSize: '0.85rem', maxWidth: '400px', margin: 0 }}>
          {error?.message ?? 'An unexpected error occurred. This has been logged.'}
        </p>
        {error?.digest && (
          <code style={{ fontSize: '0.7rem', color: '#494454', background: '#1d2022', padding: '4px 8px', borderRadius: '6px' }}>
            {error.digest}
          </code>
        )}
        <button
          onClick={reset}
          style={{ marginTop: '8px', padding: '10px 24px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
