"use client";

import { useRouter } from "next/navigation";

export default function TextBackButton({ text = "← Go Back" }: { text?: string }) {
  const router = useRouter();

  return (
    <button 
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="flex items-center gap-1.5 transition-opacity hover:opacity-70" 
      style={{ 
        marginBottom: 16, 
        border: "none", 
        background: "transparent", 
        cursor: "pointer", 
        padding: 0,
        fontFamily: "'Quicksand', sans-serif",
        fontWeight: 500,
        fontSize: "15px",
        color: "#8B7355"
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      {text.replace("← ", "")}
    </button>
  );
}
