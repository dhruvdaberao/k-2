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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orderSkeletonShimmer {
          0% { background-position: -800px 0; }
          100% { background-position: 800px 0; }
        }
        .os-shimmer {
          background: linear-gradient(90deg, #EAE1D3 25%, #f5efe6 37%, #EAE1D3 63%);
          background-size: 800px 100%;
          animation: orderSkeletonShimmer 2s infinite linear;
          border-radius: 8px;
        }
        .os-card {
          background-color: #FDFBF7;
          border: 1px solid #E6DCCF;
          border-radius: 24px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
      `}} />

      {type === "list" ? (
        <>
          {/* Header Skeleton */}
          <div className="os-shimmer mx-auto mb-4" style={{ width: '192px', height: '32px', borderRadius: '999px' }} />
          <div className="os-shimmer mb-6" style={{ width: '100%', height: '48px', borderRadius: '999px' }} />
          
          {/* List Cards Skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} className="os-card" style={{ height: '140px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div className="os-shimmer" style={{ width: '33%', height: '20px' }} />
                 <div className="os-shimmer" style={{ width: '25%', height: '20px', borderRadius: '999px' }} />
              </div>
              <div className="os-shimmer" style={{ width: '50%', height: '16px', marginTop: '8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #f9f9f9', paddingTop: '12px' }}>
                 <div className="os-shimmer" style={{ width: '25%', height: '24px' }} />
                 <div className="os-shimmer" style={{ width: '25%', height: '40px', borderRadius: '999px' }} />
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
           {/* Detail Skeleton */}
           <div className="os-shimmer mb-6" style={{ width: '128px', height: '24px', borderRadius: '999px' }} />
           <div className="os-card" style={{ height: '300px', gap: '16px' }}>
              <div className="os-shimmer" style={{ width: '50%', height: '24px' }} />
              <div className="os-shimmer" style={{ width: '33%', height: '16px' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                 <div className="os-shimmer" style={{ width: '25%', height: '24px', borderRadius: '999px' }} />
                 <div className="os-shimmer" style={{ width: '25%', height: '24px', borderRadius: '999px' }} />
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                 <div className="os-shimmer" style={{ flex: 1, height: '48px', borderRadius: '999px' }} />
                 <div className="os-shimmer" style={{ flex: 1, height: '48px', borderRadius: '999px' }} />
              </div>
           </div>
           <div className="os-card" style={{ height: '128px', marginTop: '16px' }}>
              <div className="os-shimmer" style={{ width: '100%', height: '100%' }} />
           </div>
        </>
      )}

      {showReload && (
        <div className="text-center mt-8" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p className="text-[#8B7355] font-bold mb-3" style={{ fontSize: '14px' }}>Taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ backgroundColor: '#5a3e2b', color: '#ffffff', border: 'none', borderRadius: '999px', padding: '12px 24px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            Reload Page
          </button>
        </div>
      )}
    </div>
  );
}
