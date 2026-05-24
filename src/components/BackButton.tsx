"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.opener) {
      window.close();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };
  
  return (
    <button
      onClick={handleBack}
      style={{
        background: "none",
        border: "none",
        padding: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        color: "#5a3e2b",
        marginLeft: "-8px",
      }}
      aria-label="Go Back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
