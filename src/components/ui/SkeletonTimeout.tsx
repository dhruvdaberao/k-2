"use client";
import { useEffect, useState } from "react";

export default function SkeletonTimeout({ children }: { children: React.ReactNode }) {
  const [showReload, setShowReload] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowReload(true), 3000); // 3 seconds timeout
    return () => clearTimeout(timer);
  }, []);

  if (showReload) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-4 w-full min-h-[300px] py-16 bg-[#FDFBF7] rounded-2xl border border-[#E6DCCF] animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-60"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.25 4.22"/></svg>
        <p className="text-[#4A3219] mb-2 font-medium text-lg">Taking too long to load?</p>
        <p className="text-stone-500 mb-6 text-sm">Sometimes the network can be a bit slow.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#8B7355] text-white px-8 py-3 rounded-full font-medium hover:bg-[#6b5840] transition-colors shadow-sm"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
