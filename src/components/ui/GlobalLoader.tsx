"use client";

export default function GlobalLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#FDFBF7] w-full h-full">
      <div className="flex flex-col items-center justify-center text-center p-4">
        <div 
          style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e6ded4', 
            borderTop: '4px solid #5a3e2b', 
            borderRadius: '50%', 
            animation: 'co-spin 1s linear infinite', 
            marginBottom: '20px'
          }} 
        />
        <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-lg font-medium text-[#5a3e2b] m-0 animate-pulse" style={{ letterSpacing: '0.5px' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
