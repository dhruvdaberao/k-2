"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error caught by global-error.tsx:", error);
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // ignore
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#f1ebe6', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#5a3e2b' }}>Oops! Something went wrong.</h2>
          <p style={{ color: '#4b5563', marginBottom: '24px', maxWidth: '400px' }}>
            We encountered a critical error. This usually happens due to a corrupted temporary session. We have cleared your local cache to fix this.
          </p>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '24px', color: '#d32f2f', fontSize: '14px', wordBreak: 'break-word', maxWidth: '90vw' }}>
            <strong>Error Details:</strong> {error.message || "Unknown error"}
          </div>
          <button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            style={{ padding: '10px 24px', backgroundColor: '#5a3e2b', color: '#fff', borderRadius: '9999px', fontWeight: '500', border: 'none', cursor: 'pointer' }}
          >
            Refresh & Continue
          </button>
        </div>
      </body>
    </html>
  );
}
