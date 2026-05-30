"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function GlobalLoader({ message = "Loading..." }: { message?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#FDFBF7]/70 backdrop-blur-[3px] w-full h-full" 
      style={{ zIndex: 99999 }}
    >
      <div 
        style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #E6DCCF', 
          borderTop: '4px solid #4A3219', 
          borderRadius: '50%', 
          animation: 'co-spin 1s linear infinite', 
          marginBottom: '16px',
        }} 
      />
      <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
      {message && (
        <p className="text-base font-bold text-[#4A3219] m-0 animate-pulse text-center" style={{ letterSpacing: '0.5px' }}>
          {message}
        </p>
      )}
    </div>,
    document.body
  );
}
