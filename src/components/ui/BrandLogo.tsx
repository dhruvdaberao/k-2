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
        {/* 16 Alternating Petals drawn as Yarn Loops (No fill, thick round strokes) */}
        {[...Array(16)].map((_, i) => (
          <ellipse 
            key={i}
            cx="0" 
            cy="-31"  // Positioned so the bottom of the loop touches the center circle exactly
            rx="5" 
            ry="12" 
            fill="none" 
            stroke={i % 2 === 0 ? "#E88C31" : "#F4B41A"} 
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${i * 22.5})`} 
          />
        ))}
        
        {/* Floral Center (Yarn Outline) */}
        <circle cx="0" cy="0" r="19" fill="none" stroke="#4A3324" strokeWidth="3" />
        
        {/* Yarn/Crochet inner spiral details */}
        <circle cx="0" cy="0" r="12" fill="none" stroke="#4A3324" strokeWidth="2.5" strokeDasharray="4 4" opacity={0.8} />
        <circle cx="0" cy="0" r="5" fill="none" stroke="#4A3324" strokeWidth="2" strokeDasharray="2 3" opacity={0.6} />
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
