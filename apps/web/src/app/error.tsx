'use client';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif', color: '#e0e3e5' }}>
      <div style={{ fontSize: '2rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Page error</h2>
      <p style={{ color: '#9a9aa5', fontSize: '0.8rem', maxWidth: '400px', margin: 0 }}>
        {error?.message ?? 'Unknown error in page component'}
      </p>
      {error?.digest && (
        <code style={{ fontSize: '0.7rem', color: '#8B5CF6', background: '#1d2022', padding: '4px 8px', borderRadius: '6px' }}>
          digest: {error.digest}
        </code>
      )}
      <button onClick={reset} style={{ padding: '8px 20px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  );
}
