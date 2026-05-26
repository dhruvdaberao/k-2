"use client";

export default function GlobalLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#4A3219]/60 backdrop-blur-sm w-full h-full">
      <div className="flex flex-col items-center justify-center text-center p-4">
        <div 
          style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(255, 255, 255, 0.2)', 
            borderTop: '4px solid #FDFBF7', 
            borderRadius: '50%', 
            animation: 'co-spin 1s linear infinite', 
            marginBottom: '20px',
            boxShadow: '0 0 15px rgba(0,0,0,0.1)'
          }} 
        />
        <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-lg font-bold text-white m-0 animate-pulse drop-shadow-md" style={{ letterSpacing: '0.5px' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
