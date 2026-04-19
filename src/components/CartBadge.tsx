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
