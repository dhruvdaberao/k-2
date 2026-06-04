import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  return (
    <img 
      src="/nav-icons/keshvi-sunflower-logo.png" 
      alt="Keshvi Crafts Logo" 
      className={className}
      style={{ 
        height: `${size}px`, 
        width: 'auto', 
        objectFit: 'contain',
        flexShrink: 0, 
        display: 'block' 
      }} 
    />
  );
}
