import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  return (
    <div className={`brand-logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width={size} 
        height={size}
        style={{ flexShrink: 0 }}
      >
        <g transform="translate(50,50)">
          {/* Alternating Petals */}
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#E88C31" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#F4B41A" transform="rotate(45)" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#E88C31" transform="rotate(90)" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#F4B41A" transform="rotate(135)" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#E88C31" transform="rotate(180)" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#F4B41A" transform="rotate(225)" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#E88C31" transform="rotate(270)" />
          <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#F4B41A" transform="rotate(315)" />
          
          {/* Floral Center */}
          <circle cx="0" cy="0" r="15" fill="#4A3324" />
          
          {/* Subtle Crochet/Woven Inner Details */}
          <circle cx="0" cy="0" r="10" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />
          <circle cx="0" cy="0" r="5" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.4} />
        </g>
      </svg>
      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '2px', textAlign: 'left' }}>
        <span style={{ 
          fontFamily: 'var(--font-playfair), serif', 
          fontSize: `${size * 0.03}rem`, // Scales with size (e.g. 1.44rem for 48px)
          fontStyle: 'italic', 
          fontWeight: 700, 
          color: '#3E2A1E', 
          lineHeight: 0.9 
        }}>
          Keshvi
        </span>
        <span style={{ 
          fontFamily: 'var(--font-quicksand), sans-serif', 
          fontSize: `${size * 0.0135}rem`, // Scales with size (e.g. 0.65rem for 48px)
          fontWeight: 700, 
          color: '#6B4C3A', 
          letterSpacing: '0.2em', 
          textTransform: 'uppercase', 
          marginTop: `${size * 0.08}px`
        }}>
          Crafts
        </span>
      </div>
    </div>
  );
}
