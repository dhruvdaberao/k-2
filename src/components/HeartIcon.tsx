"use client";

interface HeartIconProps {
  filled: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function HeartIcon({ filled, onClick, className = "" }: HeartIconProps) {
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      fill={filled ? "#e63946" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke={filled ? "#e63946" : "currentColor"}
      className={`w-6 h-6 transition-all duration-200 hover:scale-110 active:scale-90 ${className}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.015-4.5-4.5-4.5-1.74 0-3.255 1.007-4.5 2.09-1.245-1.083-2.76-2.09-4.5-2.09C5.015 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}
