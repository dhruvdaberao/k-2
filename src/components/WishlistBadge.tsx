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
        width: isSmall ? 16 : 24,
        height: isSmall ? 16 : 24,
        borderRadius: "50%",
        background: "#C84C35",
        color: "#fff",
        fontSize: isSmall ? 9 : 12,
        fontWeight: 600,
        lineHeight: isSmall ? "16px" : "24px",
        padding: 0,
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
