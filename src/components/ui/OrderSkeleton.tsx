"use client";

import { useState, useEffect } from "react";

export default function OrderSkeleton({ type = "list" }: { type?: "list" | "detail" }) {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReload(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full min-h-[60vh] py-10 px-4 max-w-4xl mx-auto flex flex-col gap-6" style={{ fontFamily: 'Quicksand, sans-serif' }}>
      {type === "list" ? (
        <>
          {/* Header Skeleton */}
          <div className="w-48 h-8 bg-[#E6DCCF] rounded-full animate-pulse mx-auto mb-4" />
          <div className="w-full h-12 bg-[#E6DCCF] rounded-[999px] animate-pulse mb-6" />
          
          {/* List Cards Skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full h-[140px] bg-[#F5EFE6] rounded-[24px] border border-[#E6DCCF] animate-pulse p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="w-1/3 h-5 bg-[#E6DCCF] rounded-md" />
                 <div className="w-1/4 h-5 bg-[#E6DCCF] rounded-full" />
              </div>
              <div className="w-1/2 h-4 bg-[#E6DCCF] rounded-md mt-2" />
              <div className="flex justify-between items-center mt-auto border-t border-gray-50 pt-3">
                 <div className="w-1/4 h-6 bg-[#E6DCCF] rounded-md" />
                 <div className="w-1/4 h-10 bg-[#E6DCCF] rounded-[14px]" />
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
           {/* Detail Skeleton */}
           <div className="w-32 h-6 bg-[#E6DCCF] rounded-full animate-pulse mb-6" />
           <div className="w-full h-[300px] bg-[#F5EFE6] rounded-[24px] border border-[#E6DCCF] animate-pulse p-5 flex flex-col gap-4">
              <div className="w-1/2 h-6 bg-[#E6DCCF] rounded-md" />
              <div className="w-1/3 h-4 bg-[#E6DCCF] rounded-md" />
              <div className="flex gap-2 mt-4">
                 <div className="w-1/4 h-6 bg-[#E6DCCF] rounded-full" />
                 <div className="w-1/4 h-6 bg-[#E6DCCF] rounded-full" />
              </div>
              <div className="mt-auto flex justify-between gap-4">
                 <div className="flex-1 h-12 bg-[#E6DCCF] rounded-[14px]" />
                 <div className="flex-1 h-12 bg-[#E6DCCF] rounded-[14px]" />
              </div>
           </div>
           <div className="w-full h-32 bg-[#F5EFE6] rounded-[24px] border border-[#E6DCCF] animate-pulse mt-4" />
        </>
      )}

      {showReload && (
        <div className="text-center mt-8 animate-fade-in flex flex-col items-center">
          <p className="text-sm text-[#8B7355] font-bold mb-3">Taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 transition shadow-sm font-black uppercase tracking-widest text-xs"
            style={{ backgroundColor: '#5a3e2b', color: '#ffffff', border: 'none', borderRadius: '14px' }}
          >
            Reload Page
          </button>
        </div>
      )}
    </div>
  );
}
