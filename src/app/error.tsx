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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand, #5a3e2b)" }}>Oops! Something went wrong.</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We encountered an unexpected error. This usually happens due to a corrupted temporary session. We have cleared your local cache to fix this.
      </p>
      <button
        onClick={() => {
          reset();
          window.location.href = "/";
        }}
        className="px-6 py-2 rounded-full font-medium transition hover:opacity-80 text-white"
        style={{ backgroundColor: "var(--brand, #5a3e2b)" }}
      >
        Refresh & Continue
      </button>
    </div>
  );
}
