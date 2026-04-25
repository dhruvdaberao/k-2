"use client";

import { useEffect, useState } from "react";
import { subscribeToast } from "@/lib/toast";

export default function GlobalToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToast((msg) => {
      setMessage(msg);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-[#5a3e2b] text-white px-6 py-2.5 rounded-full shadow-lg text-sm font-medium transition-all duration-300">
        {message}
      </div>
    </div>
  );
}
