import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  // viewBox width is 250, height is 100. So width is 2.5x height.
  
  const flowerGeometry = (
    <>
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
    </>
  );

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 250 100" 
      width={size * 2.5} 
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <clipPath id="left-half">
          <rect x="-50" y="-50" width="50" height="100" />
        </clipPath>
        <clipPath id="right-half">
          <rect x="0" y="-50" width="50" height="100" />
        </clipPath>
      </defs>

      {/* Left Flower (flat edge facing right towards text) */}
      <g transform="translate(50,50)" clipPath="url(#left-half)">
        {flowerGeometry}
      </g>
      
      {/* Stacked Text Centered */}
      <text 
        x="65" 
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
        x="65" 
        y="86" 
        fontFamily="'Playfair Display', serif" 
        fontSize="44" 
        fontWeight="500" 
        fill="#1a1a1a"
        letterSpacing="-0.02em"
      >
        Crafts
      </text>

      {/* Right Flower (flat edge facing left towards text) */}
      <g transform="translate(200,50)" clipPath="url(#right-half)">
        {flowerGeometry}
      </g>
    </svg>
  );
}
