"use client";

import { useWishlist } from "@/hooks/useWishlist";

interface WishlistHeartProps {
  product: any;
  size?: number;
  className?: string;
}

export default function WishlistHeart({ product, size = 24, className = "" }: WishlistHeartProps) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  
  // Use product.id || product.slug consistency
  const id = product?.id || product?.slug || "";
  const isHearted = isWishlisted(id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <button
      onClick={handleClick}
      className={`wishlist-heart-btn flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
      aria-label={isHearted ? "Remove from wishlist" : "Add to wishlist"}
      type="button"
      style={{
        background: "none",
        border: "none",
        padding: "4px",
        cursor: "pointer",
        outline: "none"
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isHearted ? "#e63946" : "none"}
        stroke={isHearted ? "#e63946" : "currentColor"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-200"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
