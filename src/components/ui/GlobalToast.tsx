"use client";

import { useEffect, useState } from "react";
import { subscribeToast } from "@/lib/toast";

export default function GlobalToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let exitTimer: NodeJS.Timeout;
    const unsubscribe = subscribeToast((msg) => {
      setMessage(msg);
      setVisible(true);
      setIsExiting(false);

      const timer = setTimeout(() => {
        setIsExiting(true);
        exitTimer = setTimeout(() => {
          setVisible(false);
        }, 300); // match transition duration
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearTimeout(exitTimer);
      };
    });

    return unsubscribe;
  }, []);

  if (!visible) return null;

  const lowerMsg = message.toLowerCase();
  let textColor = "#2f2a26"; // Default dark brown
  let icon = null;

  if (lowerMsg.includes("success") || lowerMsg.includes("added")) {
    textColor = "#059669"; // Green
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    );
  } else if (
    lowerMsg.includes("error") || 
    lowerMsg.includes("fail") || 
    lowerMsg.includes("invalid") || 
    lowerMsg.includes("wrong") ||
    lowerMsg.includes("weak")
  ) {
    textColor = "#dc2626"; // Red
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    );
  }

  return (
    <div 
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: `translateX(-50%) translateY(${isExiting ? "-20px" : "0"})`,
        opacity: isExiting ? 0 : 1,
        zIndex: 999999,
        transition: "all 0.3s ease-out",
        pointerEvents: "none"
      }}
    >
      <div 
        style={{
          backgroundColor: "#ffffff",
          color: textColor,
          padding: "10px 20px",
          borderRadius: "9999px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e6ded4",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap"
        }}
      >
        {icon}
        {message}
      </div>
    </div>
  );
}
