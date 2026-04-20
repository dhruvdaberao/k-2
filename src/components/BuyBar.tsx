"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleAddToCart, loadCart, updateQty, removeFromCart } from "@/lib/bags";
import { trackEvent } from "@/lib/analytics";

export default function BuyBar({
  slug, title, price, image, checkoutUrl, disabled = false, productSlug
}: {
  slug: string; title: string; price: number; image?: string;
  checkoutUrl?: string; disabled?: boolean; productSlug: string;
}) {
  const router = useRouter();
  const [cartQuantity, setCartQuantity] = useState(0);

  // Sync cart qty on mount and on bag:changed events
  const syncQty = async () => {
    const list = await loadCart();
    const item = list.find((x: any) => x.id === slug);
    setCartQuantity(item?.quantity ?? 0);
  };

  useEffect(() => {
    syncQty();
    window.addEventListener("bag:changed", syncQty);
    return () => window.removeEventListener("bag:changed", syncQty);
  }, [slug]);

  async function onAddToCart() {
    await handleAddToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "add_to_cart", category: "Ecommerce", label: title, value: price });
  }

  async function handleIncrease() {
    await updateQty(slug, cartQuantity + 1);
  }

  async function handleDecrease() {
    if (cartQuantity <= 1) await removeFromCart(slug);
    else await updateQty(slug, cartQuantity - 1);
  }

  async function onBuyNow() {
    await handleAddToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "begin_checkout", category: "Ecommerce", label: title, value: price });
    setTimeout(() => router.push("/cart"), 100);
  }

  return (
    <div className="buy-bar">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "0.8rem" }}>
        {/* Buy Now */}
        <button
          className="btn-primary"
          onClick={onBuyNow}
          disabled={disabled}
          style={{ flex: "1 1 auto", minWidth: "140px", borderRadius: "12px", height: "48px" }}
        >
          Buy Now
        </button>

        {/* Add to Cart / In-cart qty control */}
        {cartQuantity > 0 ? (
          <div style={{
            flex: "1 1 auto",
            minWidth: "140px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0",
            background: "#2f2a26",
            borderRadius: "12px",
            overflow: "hidden",
            height: "48px",
          }}>
            <button
              onClick={handleDecrease}
              style={{
                flex: "0 0 48px",
                height: "100%",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.4rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span style={{
              flex: 1,
              textAlign: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "1rem",
              userSelect: "none",
            }}>
              {cartQuantity}
            </span>
            <button
              onClick={handleIncrease}
              style={{
                flex: "0 0 48px",
                height: "100%",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.4rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            className="btn-secondary"
            onClick={onAddToCart}
            disabled={disabled}
            style={{ flex: "1 1 auto", minWidth: "140px", borderRadius: "12px", height: "48px" }}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
