'use client';

// Catches errors thrown in the root layout. Must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#09090B', color: '#FAFAFA' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: '#A1A1AA', maxWidth: 420 }}>A critical error occurred while loading Haseeela.</p>
          <button
            onClick={() => reset()}
            style={{ height: 36, padding: '0 16px', borderRadius: 12, border: 'none', background: '#7C6FFF', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
