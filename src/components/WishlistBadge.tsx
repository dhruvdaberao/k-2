// components/WishlistBadge.tsx
"use client";

import { useWishlist } from "@/hooks/useWishlist";

export default function WishlistBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const { itemCount: n } = useWishlist();

  if (!n) return null;

  const isSmall = size === "sm";

  return (
    <span
      className={`wishlist-badge cart-badge ${isSmall ? "badge-sm" : ""}`}
      style={{
        display: "inline-flex",
        minWidth: isSmall ? 15 : 20,
        height: isSmall ? 15 : 20,
        borderRadius: isSmall ? 7.5 : 10,
        background: "#C2410C",
        color: "#fff",
        fontSize: isSmall ? 8 : 11,
        fontWeight: 600,
        lineHeight: isSmall ? "15px" : "20px",
        padding: isSmall ? "0 3px" : "0 5px",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        verticalAlign: "middle"
      }}
    >
      {n}
    </span>
  );
}
