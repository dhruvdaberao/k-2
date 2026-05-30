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
      className="meta" 
      style={{ 
        display: "inline-block", 
        marginBottom: 16, 
        border: "none", 
        background: "transparent", 
        cursor: "pointer", 
        padding: 0,
        fontFamily: "inherit",
        fontSize: "inherit"
      }}
    >
      {text}
    </button>
  );
}
