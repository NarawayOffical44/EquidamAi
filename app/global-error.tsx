'use client';

export default function GlobalError() {
  return (
    <html>
      <body style={{ margin: 0, padding: 20, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Something went wrong</h1>
        <p>Please try refreshing the page.</p>
      </body>
    </html>
  );
}
