"use client";

import { useMemo } from "react";
import { useCart } from "@/hooks/useCart";

export default function CartBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const { cartItems } = useCart();

  const n = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  if (!n) return null;

  const isSmall = size === "sm";

  return (
    <span
      className={`cart-badge ${isSmall ? "badge-sm" : ""}`}
      style={{
        display: "inline-flex",
        width: isSmall ? 16 : 24,
        height: isSmall ? 16 : 24,
        borderRadius: "50%",
        background: "#E91E63",
        color: "#fff",
        fontSize: isSmall ? 9 : 12,
        fontWeight: 600,
        lineHeight: isSmall ? "16px" : "24px",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: isSmall ? 0 : 4,
        pointerEvents: "none",
        verticalAlign: "middle",
        position: isSmall ? "absolute" : "relative",
        top: isSmall ? "-4px" : "-1px"
      }}
    >
      {n}
    </span>
  );
}
