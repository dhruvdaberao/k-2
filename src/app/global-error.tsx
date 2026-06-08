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
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-[#f1ebe6]">
          <h2 className="text-2xl font-bold mb-4 text-[#5a3e2b]">Oops! Something went wrong.</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            We encountered a critical error. This usually happens due to a corrupted temporary session. We have cleared your local cache to fix this.
          </p>
          <button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="px-6 py-2 bg-[#5a3e2b] text-white rounded-full font-medium transition hover:opacity-80"
          >
            Refresh & Continue
          </button>
        </div>
      </body>
    </html>
  );
}
