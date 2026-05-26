"use client";

import React, { useState } from 'react';

interface AnimatedHeartProps {
  isHearted: boolean;
  onClick: () => void;
  className?: string; 
}

export default function AnimatedHeart({ isHearted, onClick, className = '' }: AnimatedHeartProps) {
  const [isPopping, setIsPopping] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only animate burst when liking (not when unliking)
    if (!isHearted) {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 700);
    }
    
    onClick();
  };

  return (
    <div 
      className={`relative cursor-pointer flex items-center justify-center p-2 z-10 ${className}`}
      onClick={handleClick}
      style={{ width: '40px', height: '40px' }}
    >
      {/* Particles Box */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none bg-transparent ${isPopping ? 'particles-burst' : 'opacity-0'}`} />

      {/* Heart Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill={isHearted ? "#EC4899" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="#EC4899"
        className={`w-6 h-6 transition-all duration-200 ${isPopping ? 'animate-heart-burst' : 'hover:scale-110'}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.015-4.5-4.5-4.5-1.74 0-3.255 1.007-4.5 2.09-1.245-1.083-2.76-2.09-4.5-2.09C5.015 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>

      <style>{`
        .animate-heart-burst {
          animation: burstBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes burstBounce {
          0% { transform: scale(1); }
          25% { transform: scale(0.5); }
          50% { transform: scale(1.2); }
          75% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        .particles-burst {
          animation: particleBurst 0.6s ease-out forwards;
        }

        @keyframes particleBurst {
          0% {
            opacity: 1;
            box-shadow: 
              0 -10px 0 -2px #EC4899,
              7px -7px 0 -2px #EC4899,
              10px 0 0 -2px #EC4899,
              7px 7px 0 -2px #EC4899,
              0 10px 0 -2px #EC4899,
              -7px 7px 0 -2px #EC4899,
              -10px 0 0 -2px #EC4899,
              -7px -7px 0 -2px #EC4899;
          }
          100% {
            opacity: 0;
            box-shadow: 
              0 -26px 0 -4px #EC4899,
              18px -18px 0 -4px #EC4899,
              26px 0 0 -4px #EC4899,
              18px 18px 0 -4px #EC4899,
              0 26px 0 -4px #EC4899,
              -18px 18px 0 -4px #EC4899,
              -26px 0 0 -4px #EC4899,
              -18px -18px 0 -4px #EC4899;
          }
        }
      `}</style>
    </div>
  );
}
