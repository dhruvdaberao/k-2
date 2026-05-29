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
          {/* 16 Alternating Petals */}
          {[...Array(16)].map((_, i) => (
            <ellipse 
              key={i}
              cx="0" 
              cy="-26" 
              rx="7" 
              ry="24" 
              fill={i % 2 === 0 ? "#E88C31" : "#F4B41A"} 
              transform={`rotate(${i * 22.5})`} 
            />
          ))}
          
          {/* Floral Center (Larger for Sunflower) */}
          <circle cx="0" cy="0" r="21" fill="#4A3324" />
          
          {/* Subtle Crochet/Woven Inner Details */}
          <circle cx="0" cy="0" r="14" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />
          <circle cx="0" cy="0" r="7" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.4} />
        </g>
      </svg>
      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '4px', textAlign: 'left' }}>
        <span style={{ 
          fontFamily: "'Playfair Display', serif", 
          fontSize: `${size * 0.026}rem`, 
          fontWeight: 700, 
          color: '#3E2A1E', 
          lineHeight: 1
        }}>
          Keshvi
        </span>
        <span style={{ 
          fontFamily: "'Playfair Display', serif", 
          fontSize: `${size * 0.026}rem`, 
          fontWeight: 700, 
          color: '#3E2A1E', 
          lineHeight: 1 
        }}>
          Crafts
        </span>
      </div>
    </div>
  );
}
