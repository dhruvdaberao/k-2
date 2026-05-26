"use client";

export default function GlobalLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#FAF7F2] w-full h-full">
      <div 
        style={{ 
          width: '60px', 
          height: '60px', 
          border: '5px solid rgba(74, 50, 25, 0.1)', 
          borderTop: '5px solid #4A3219', 
          borderRadius: '50%', 
          animation: 'co-spin 1s linear infinite', 
          marginBottom: '20px',
          boxShadow: '0 0 20px rgba(74, 50, 25, 0.1)'
        }} 
      />
      <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
      <p className="text-lg font-bold text-[#4A3219] m-0 animate-pulse text-center" style={{ letterSpacing: '0.5px' }}>
        {message}
      </p>
    </div>
  );
}
