"use client";

export default function GlobalLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#FDFBF7]">
      <div className="text-center">
        <div 
          style={{ 
            width: 44, 
            height: 44, 
            border: '4px solid #e6ded4', 
            borderTop: '4px solid #5a3e2b', 
            borderRadius: '50%', 
            animation: 'co-spin 0.8s linear infinite', 
            margin: '0 auto' 
          }} 
          className="mb-4" 
        />
        <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
        <p className="font-semibold text-[#5a3e2b] animate-pulse">{message}</p>
      </div>
    </div>
  );
}
