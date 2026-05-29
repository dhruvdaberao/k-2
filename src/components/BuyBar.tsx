"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { trackEvent } from "@/lib/analytics";
import { setDirectCheckoutItem } from "@/lib/directCheckout";

export default function BuyBar({
  slug, title, price, image, checkoutUrl, disabled = false, productSlug
}: {
  slug: string; title: string; price: number; image?: string;
  checkoutUrl?: string; disabled?: boolean; productSlug: string;
}) {
  const router = useRouter();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cartItems.find((x) => x.id === slug);
  const cartQuantity = cartItem?.quantity || 0;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  async function onAddToCart() {
    if (disabled) {
      setShowOutOfStockModal(true);
      return;
    }
    await addToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "add_to_cart", category: "Ecommerce", label: title, value: price });
  }

  async function handleIncrease() {
    await updateQuantity(slug, cartQuantity + 1);
  }

  async function handleDecrease() {
    if (cartQuantity <= 1) await removeFromCart(slug);
    else await updateQuantity(slug, cartQuantity - 1);
  }

  // ── Buy Now flow ────────────────────────────────────────────────────────
  function onBuyNowClick() {
    if (disabled) {
      setShowOutOfStockModal(true);
      return;
    }
    setShowConfirmModal(true);
  }

  // User chose "No" → old behavior (add to cart → go to cart)
  async function handleBuyViaCart() {
    setShowConfirmModal(false);
    await addToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "begin_checkout", category: "Ecommerce", label: title, value: price });
    setTimeout(() => router.push("/cart"), 100);
  }

  // User chose "Yes" → open quantity picker
  function handleBuyDirect() {
    setShowConfirmModal(false);
    setBuyQty(1);
    setShowQtyModal(true);
  }

  // User confirms direct checkout
  function handleProceedDirect() {
    setDirectCheckoutItem({
      product_id: slug,
      name: title,
      price,
      image: image || "/placeholder.png",
      quantity: buyQty,
    });
    trackEvent({ action: "buy_now_direct", category: "Ecommerce", label: title, value: price * buyQty });
    setShowQtyModal(false);
    router.push("/checkout?buyNow=true");
  }

  return (
    <>
      <div className="buy-bar">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "0.8rem" }}>
          {disabled ? (
            <button
              className="btn-primary"
              disabled
              style={{
                flex: "1 1 auto",
                width: "100%",
                borderRadius: "12px",
                height: "48px",
                opacity: 0.6,
                backgroundColor: "#8B7355",
                color: "#F5EFE6",
                cursor: "not-allowed",
                fontWeight: "bold",
                border: "none",
              }}
            >
              Out of Stock
            </button>
          ) : (
            <>
              {/* Buy Now */}
              <button
                className="btn-primary"
                onClick={onBuyNowClick}
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
                      outline: "none",
                      WebkitTapHighlightColor: "transparent",
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
                      outline: "none",
                      WebkitTapHighlightColor: "transparent",
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
                  style={{ flex: "1 1 auto", minWidth: "140px", borderRadius: "12px", height: "48px" }}
                >
                  Add to Cart
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modal 1: Confirm direct buy ──────────────────── */}
      {showOutOfStockModal && (
        <div className="bnm-overlay" onClick={() => setShowOutOfStockModal(false)}>
          <div className="bnm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bnm-title">Item Out of Stock</h3>
            <p className="bnm-text">
              Sorry, <strong>{title}</strong> is currently out of stock. We are working on making more!
            </p>
            <div className="bnm-actions">
              <button className="bnm-btn bnm-btn--primary" onClick={() => setShowOutOfStockModal(false)}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="bnm-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="bnm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bnm-title">Buy only this item?</h3>
            <p className="bnm-text">
              Skip the cart and checkout with just <strong>{title}</strong>?
            </p>
            <div className="bnm-actions">
              <button className="bnm-btn bnm-btn--secondary" onClick={handleBuyViaCart}>
                No, Add to Bag
              </button>
              <button className="bnm-btn bnm-btn--primary" onClick={handleBuyDirect}>
                Yes, Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Quantity picker ─────────────────────── */}
      {showQtyModal && (
        <div className="bnm-overlay" onClick={() => setShowQtyModal(false)}>
          <div className="bnm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bnm-title">{title}</h3>
            <p className="bnm-text">Select quantity</p>

            <div className="bnm-qty-row">
              <button
                className="bnm-qty-btn"
                onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                disabled={buyQty <= 1}
              >
                −
              </button>
              <input
                type="number"
                className="bnm-qty-input"
                value={buyQty}
                min={1}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setBuyQty(v);
                }}
              />
              <button
                className="bnm-qty-btn"
                onClick={() => setBuyQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <div className="bnm-price-preview">
              ₹{(price * buyQty).toLocaleString("en-IN")}
            </div>

            <button className="bnm-btn bnm-btn--primary bnm-btn--full" onClick={handleProceedDirect}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* ── Scoped modal styles ──────────────────────────── */}
      <style jsx>{`
        .bnm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 9999;
        }

        .bnm-modal {
          background: #FDFBF7;
          border-radius: 20px;
          padding: 28px 24px;
          max-width: 380px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          text-align: center;
        }

        .bnm-title {
          font-size: 20px;
          font-weight: 700;
          color: #3E2C1C;
          margin: 0 0 8px;
          font-family: var(--font-serif, serif);
        }

        .bnm-text {
          font-size: 14px;
          color: #8B7355;
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .bnm-actions {
          display: flex;
          gap: 10px;
        }

        .bnm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 30px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
        }

        .bnm-btn--primary {
          background: #4A3219;
          color: #fff;
        }

        .bnm-btn--primary:hover {
          background: #3B2814;
        }

        .bnm-btn--secondary {
          background: #F5EFE6;
          color: #5A3E2B;
          border: 1.5px solid #E6DCCF;
        }

        .bnm-btn--secondary:hover {
          background: #EDE5D8;
        }

        .bnm-btn--full {
          width: 100%;
          margin-top: 20px;
        }

        /* Quantity row */
        .bnm-qty-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin: 0 auto 12px;
          background: #2f2a26;
          border-radius: 30px;
          overflow: hidden;
          max-width: 180px;
          height: 48px;
        }

        .bnm-qty-btn {
          width: 48px;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
          -webkit-tap-highlight-color: transparent;
          color: white;
          font-size: 1.3rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .bnm-qty-btn:focus {
          outline: none;
          box-shadow: none;
        }

        .bnm-qty-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .bnm-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .bnm-qty-input {
          flex: 1;
          text-align: center;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          outline: none;
          width: 60px;
          -moz-appearance: textfield;
        }

        .bnm-qty-input::-webkit-inner-spin-button,
        .bnm-qty-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .bnm-price-preview {
          font-size: 26px;
          font-weight: 800;
          color: #3E2C1C;
          font-family: var(--font-outfit), var(--font-sans, system-ui), sans-serif;
        }
      `}</style>
    </>
  );
}
