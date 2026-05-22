'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/monitoring/client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

export default function GlobalError({ error, reset, unstable_retry }: GlobalErrorProps) {
  const retry = unstable_retry || reset;

  useEffect(() => {
    reportClientError({
      source: 'global_boundary',
      message: error.message || 'Global application error',
      name: error.name,
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, padding: 20, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Something went wrong</h1>
        <p>Please try refreshing the page.</p>
        {retry ? (
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: 12,
              border: '1px solid #0f766e',
              borderRadius: 6,
              background: '#0f766e',
              color: 'white',
              padding: '8px 12px',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        ) : null}
      </body>
    </html>
  );
}
