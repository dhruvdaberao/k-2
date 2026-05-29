import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  // viewBox width is 480, height is 100. So width is 4.8x height.
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 480 100" 
      width={size * 4.8} 
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Full flower centered at x=50, y=50 */}
      <g transform="translate(50,50)">
        {/* 16 Alternating Petals in elegant, earthy Terracotta tones */}
        {[...Array(16)].map((_, i) => (
          <ellipse 
            key={i}
            cx="0" 
            cy="-26" 
            rx="7" 
            ry="24" 
            fill={i % 2 === 0 ? "#C84C35" : "#A63E2B"} 
            transform={`rotate(${i * 22.5})`} 
          />
        ))}
        
        {/* Floral Center */}
        <circle cx="0" cy="0" r="21" fill="#4A3324" />
        <circle cx="0" cy="0" r="14" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />
        <circle cx="0" cy="0" r="7" fill="none" stroke="#F5EFE6" strokeWidth="1.5" strokeDasharray="2 2" opacity={0.4} />
      </g>
      
      {/* Elegant Inline Text */}
      <text 
        x="115" 
        y="65" 
        fontFamily="'Playfair Display', serif" 
        fontSize="54" 
        fontWeight="500" 
        fill="#1a1a1a"
        letterSpacing="-0.02em"
      >
        Keshvi Crafts
      </text>
    </svg>
  );
}
