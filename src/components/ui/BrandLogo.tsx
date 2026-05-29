import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  // viewBox width is 300, height is 100. So width is 3x height.
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 100" 
      width={size * 3} 
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Full flower centered at x=50, y=50 */}
      <g transform="translate(50,50)">
        {/* 16 Alternating Petals in bright Yellow and Orange */}
        {[...Array(16)].map((_, i) => (
          <ellipse 
            key={i}
            cx="0" 
            cy="-28" 
            rx="7" 
            ry="24" 
            fill={i % 2 === 0 ? "#E88C31" : "#F4B41A"} 
            transform={`rotate(${i * 22.5})`} 
          />
        ))}
        
        {/* Floral Center (Made larger) */}
        <circle cx="0" cy="0" r="24" fill="#4A3324" />
        <circle cx="0" cy="0" r="16" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />
        <circle cx="0" cy="0" r="8" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.4} />
      </g>
      
      {/* Stacked Text */}
      <text 
        x="110" 
        y="42" 
        fontFamily="'Playfair Display', serif" 
        fontSize="44" 
        fontWeight="500" 
        fill="#1a1a1a"
        letterSpacing="-0.02em"
      >
        Keshvi
      </text>
      <text 
        x="110" 
        y="86" 
        fontFamily="'Playfair Display', serif" 
        fontSize="44" 
        fontWeight="500" 
        fill="#1a1a1a"
        letterSpacing="-0.02em"
      >
        Crafts
      </text>
    </svg>
  );
}
