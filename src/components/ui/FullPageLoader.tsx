'use client';
import React from 'react';
import BrandLogo from '@/components/ui/BrandLogo';

export default function FullPageLoader() {
  const [showReload, setShowReload] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowReload(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#FDFBF7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        gap: 20,
      }}
    >
      <div className="flex flex-col items-center justify-center py-4">
        <video
          autoPlay
          muted
          playsInline
          className="mb-4"
          style={{ height: '120px', width: 'auto', objectFit: 'contain' }}
        >
          <source src="/nav-icons/logo-animation.mp4" type="video/mp4" />
        </video>
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid #e6ded4',
          borderTop: '3px solid #5a3e2b',
          borderRadius: '50%',
          animation: 'fpl-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes fpl-spin { to { transform: rotate(360deg); } }`}</style>

      {showReload && (
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #5a3e2b',
            color: '#5a3e2b',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Taking too long? Reload Page
        </button>
      )}
    </div>
  );
}
