import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  // viewBox width is 220, height is 100. So width is 2.2x height.
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 220 100" 
      width={size * 2.2} 
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        {/* A mathematically perfect vertical cut down the exact middle of the flower, keeping the LEFT half */}
        <clipPath id="vertical-half">
          <rect x="-50" y="-50" width="50" height="100" />
        </clipPath>
      </defs>

      {/* Flower is shifted to x=50, showing only the left half. The flat edge is at x=50 facing the text */}
      <g transform="translate(50,50)" clipPath="url(#vertical-half)">
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
        
        <circle cx="0" cy="0" r="21" fill="#4A3324" />
        <circle cx="0" cy="0" r="14" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />
        <circle cx="0" cy="0" r="7" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.4} />
      </g>
      
      {/* Stacked Text */}
      <text 
        x="60" 
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
        x="60" 
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
