"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App Error caught by error.tsx:", error);
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center" style={{ fontFamily: 'sans-serif' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand, #5a3e2b)" }}>Oops! Something went wrong.</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We encountered an unexpected error. This usually happens due to a corrupted temporary session. We have cleared your local cache to fix this.
      </p>
      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '24px', color: '#d32f2f', fontSize: '14px', wordBreak: 'break-word', maxWidth: '90vw' }}>
        <strong>Error Details:</strong> {error.message || "Unknown error"}
      </div>
      <button
        onClick={() => {
          reset();
          window.location.href = "/";
        }}
        className="px-6 py-2 rounded-full font-medium transition hover:opacity-80 text-white"
        style={{ backgroundColor: "var(--brand, #5a3e2b)", border: 'none', cursor: 'pointer' }}
      >
        Refresh & Continue
      </button>
    </div>
  );
}
