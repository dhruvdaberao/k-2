"use client";

export default function GlobalLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] w-full h-full" 
      style={{ zIndex: 99999 }}
    >
      <div 
        style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid rgba(255, 255, 255, 0.2)', 
          borderTop: '4px solid #ffffff', 
          borderRadius: '50%', 
          animation: 'co-spin 1s linear infinite', 
          marginBottom: '16px',
        }} 
      />
      <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
      {message && (
        <p className="text-base font-bold text-white m-0 animate-pulse text-center" style={{ letterSpacing: '0.5px' }}>
          {message}
        </p>
      )}
    </div>
  );
}
