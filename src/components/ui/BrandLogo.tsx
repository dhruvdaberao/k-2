import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  // ViewBox designed for a beautiful horizontal brand lockup
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', height: `${size}px` }}>
      <svg
        viewBox="0 0 160 50"
        style={{ height: '100%', width: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(18, 22)">
          {/* Minimalist half sunflower petals pointing left */}
          <path 
            d="M 0,-9 C -10,-14 -14,-4 0,-2 C -16,-3 -16,5 0,2 C -14,6 -10,14 0,9" 
            fill="none" 
            stroke="#C84C35" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Half center */}
          <path 
            d="M 0,-4 A 4 4 0 0 0 0,4" 
            fill="none" 
            stroke="#8B7355" 
            strokeWidth="2" 
          />
          {/* Tiny decorative dots for seeds */}
          <circle cx="-2" cy="-1" r="0.5" fill="#8B7355" />
          <circle cx="-2" cy="1" r="0.5" fill="#8B7355" />
        </g>
        
        {/* "Keshvi" Text - Using the elegant Playfair Display font already loaded in the app */}
        <text 
          x="20" 
          y="29" 
          fontFamily="var(--font-playfair), Georgia, serif" 
          fontSize="28" 
          fontWeight="600" 
          fill="#2F2A26"
        >
          Keshvi
        </text>
        
        {/* "CRAFTS" subtext */}
        <text 
          x="24" 
          y="42" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="8" 
          fontWeight="700" 
          fill="#8B7355"
          letterSpacing="4"
        >
          CRAFTS
        </text>
      </svg>
    </div>
  );
}
