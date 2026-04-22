import React from 'react';

export default function FullPageLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F5EFE6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '4px solid #e6ded4',
          borderTop: '4px solid #5a3e2b',
          borderRadius: '50%',
          animation: 'fpl-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes fpl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
