import React from 'react';

export default function FullPageLoader() {
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
      <img
        src="/uploads/hero/logo.png"
        alt="Keshvi Crafts"
        style={{ height: 90, width: 'auto', mixBlendMode: 'multiply' }}
      />
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
    </div>
  );
}
