// app/cart/page.tsx
"use client";

import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import products from "@/data/products.json"; 
import { showToast } from "@/components/Toast";
import PriceProgressBar from "@/components/PriceProgressBar";
import type { Product } from "@/types";

export default function CartPage() {
  const { cartItems, loadCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const init = async () => {
      await loadCart();
      setLoading(false);
    };

    init();
  }, [loadCart]);

  const subtotal = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const itemCount = cartItems.reduce((n, it) => n + it.quantity, 0);

  // Discount Logic
  const discountableSubtotal = cartItems.reduce((s, it) => {
    const p = (products as Product[]).find(x => x.slug === it.id);
    if (p?.type === "custom-order") return s;
    return s + it.price * it.quantity;
  }, 0);

  let discountPercent = 0;
  if (discountableSubtotal >= 1800) discountPercent = 20;
  else if (discountableSubtotal >= 1250) discountPercent = 10;
  const discountAmount = Math.round((discountableSubtotal * discountPercent) / 100);
  
  // Shipping Logic
  const baseShipping = 40;
  const isFreeShipping = subtotal >= 650;
  const shippingDiscount = isFreeShipping ? -baseShipping : 0;
  const grandTotal = subtotal + baseShipping + shippingDiscount - discountAmount;

  if (loading) {
    return <main className="cart-page py-20 text-center text-stone-500 font-serif">Loading your shopping bag...</main>;
  }

  return (
    <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
      <div className="container">
        {/* Header - Always visible as per Image 2 */}
        <header className="mb-8 text-center pt-2">
          <h1 className="h2 font-serif fw-bold text-[#2f2a26] mb-1">
            Your Cart ({itemCount} items)
          </h1>
          <p className="text-secondary fst-italic small">Each piece is made to order with care</p>
        </header>

        {cartItems.length === 0 ? (
          /* Empty State Card - Matching Image 2 */
          <div className="empty-cart-card">
            <div className="mx-auto d-flex justify-content-center align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12"/>
              </svg>
            </div>
            
            <h2 className="h4 font-serif fw-bold text-[#2f2a26] mb-3">Your cart is empty</h2>
            
            <p className="text-secondary mb-8 px-4" style={{ fontSize: '0.95rem' }}>
              Looks like you haven't found your perfect piece yet.
            </p>
            
            <NextLink 
              href="/collections" 
              className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm"
              style={{ minWidth: '220px' }}
            >
              Browse Collections
            </NextLink>
          </div>
        ) : (
          <div className="row g-4 items-start">
            {/* Main List (Left) */}
            <div className="col-12 col-lg-7">
              <PriceProgressBar subtotal={subtotal} />

              <div className="cart-list-wrapper">
                {cartItems.map((it) => (
                  <div key={it.id} className="cart-item-row-refined shadow-sm">
                    {/* Left: Thumbnail */}
                    <div className="cart-item-thumbnail">
                      <img src={it.image} alt={it.name} />
                    </div>

                    {/* Center: Details & Picker */}
                    <div className="cart-item-info-center">
                      <h3 className="cart-item-name">{it.name.split(" - ")[0]}</h3>
                      <div className="qty-pill-brand-mini">
                        <button onClick={async () => {
                          if (it.quantity <= 1) {
                            if (window.confirm(`Are you sure you want to remove ${it.name} from your cart?`)) {
                              removeFromCart(it.id);
                            }
                          } else {
                            await updateQuantity(it.id, it.quantity - 1);
                          }
                        }}>&minus;</button>
                        <span>{it.quantity}</span>
                        <button onClick={async () => await updateQuantity(it.id, it.quantity + 1)}>+</button>
                      </div>
                    </div>

                    {/* Right: Price & Remove */}
                    <div className="cart-item-actions-right">
                      <div className="cart-item-price-main font-serif">₹{it.price * it.quantity}</div>
                      <button onClick={() => {
                        if (window.confirm(`Remove ${it.name} from your bag?`)) {
                          removeFromCart(it.id);
                        }
                      }} className="btn-remove-pill">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear All Footer */}
              <div className="text-center mt-4">
                <button 
                  onClick={() => {
                    if (window.confirm("This will remove all items from your shopping bag. Continue?")) {
                      clearCart();
                    }
                  }}
                  className="btn-clear-pill"
                >
                  Clear All Items
                </button>
              </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="col-12 col-lg-5">
              <div className="p-0">
                <h3 className="h5 fw-bold text-[#2f2a26] mb-4 pb-3 border-bottom border-light">Order Summary</h3>
                
                <div className="vstack gap-3 small text-secondary">
                  <div className="d-flex justify-content-between text-dark">
                    <span>Subtotal</span>
                    <span className="fw-bold">₹{subtotal}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between text-dark">
                    <span>Shipping Fee</span>
                    <span className="fw-bold">₹{baseShipping}</span>
                  </div>

                  {shippingDiscount < 0 && (
                    <div className="d-flex justify-content-between text-success fw-bold">
                      <span>Shipping Discount</span>
                      <span>-₹{Math.abs(shippingDiscount)}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="d-flex justify-content-between text-success fw-bold">
                      <span>Discount ({discountPercent}%)</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  
                  <hr className="my-2 border-light" />
                  
                  <div className="d-flex justify-content-between align-items-end">
                    <span className="h6 fw-bold text-dark mb-0">Total</span>
                    <span className="h4 fw-bold text-brown mb-0" style={{ color: "var(--brand)" }}>₹{grandTotal}</span>
                  </div>
                </div>

                <NextLink href="/checkout" className="btn btn-primary w-100 py-3 mt-4 fw-bold shadow-sm">
                  Checkout
                </NextLink>
                
                <div className="mt-4 d-flex align-items-center justify-content-center gap-2 py-2 small fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: "10px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Cash on Delivery Available
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
/main>
  );
}
