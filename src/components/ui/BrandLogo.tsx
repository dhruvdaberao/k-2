import React from 'react';

export default function BrandLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  // viewBox width is 500, height is 100. So width is 5x height.
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 100" 
      width={size * 5} 
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
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
      
      {/* Text embedded directly inside the SVG */}
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
