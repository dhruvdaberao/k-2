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
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

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

  if (cartItems.length === 0) {
    return (
      <main className="cart-page py-24 px-4 bg-[#FAF7F2] min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#eadfcd]">
            <span className="text-4xl">🛍️</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-4">Your cart is empty</h1>
          <p className="text-stone-500 mb-10 leading-relaxed">Artisanal pieces are waiting for you! Start exploring our handmade collections.</p>
          <NextLink href="/collections" className="btn-primary w-full py-4 inline-block text-center rounded-xl shadow-lg transition-all hover:scale-[1.02]">
            Browse Collections
          </NextLink>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
      <div className="container">
        {/* Compact Header */}
        <header className="mb-4 text-center">
          <h1 className="h3 font-serif fw-bold text-[#2f2a26] mb-1">
            Your Cart ({itemCount} items)
          </h1>
          <p className="text-secondary fst-italic small">Each piece is made to order with care</p>
        </header>

        <div className="row g-4 items-start">
          {/* Main List (Left) */}
          <div className="col-12 col-lg-7">
            <PriceProgressBar subtotal={subtotal} />

            {/* Cart Items List - Image 4 Pattern */}
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
                          setConfirmModal({
                            show: true,
                            title: "Remove Item?",
                            message: `Are you sure you want to remove ${it.name} from your cart?`,
                            onConfirm: () => removeFromCart(it.id)
                          });
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
                    <button onClick={() => setConfirmModal({
                      show: true,
                      title: "Remove Item?",
                      message: `Remove ${it.name} from your bag?`,
                      onConfirm: () => removeFromCart(it.id)
                    })} className="btn-remove-pill">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear All Footer */}
            <div className="text-center mt-4">
              <button 
                onClick={() => setConfirmModal({
                  show: true,
                  title: "Clear Bag?",
                  message: "This will remove all items from your shopping bag. Continue?",
                  onConfirm: () => clearCart()
                })}
                className="btn-clear-pill"
              >
                Clear All Items
              </button>
            </div>
          </div>

          {/* Sidebar (Right) */}
          {/* Sidebar (Right) - Image 4 Style (No redundant card bg) */}
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

              <NextLink href="/checkout" className="btn-primary w-100 py-3 mt-4 fw-bold shadow-sm">
                Checkout
              </NextLink>
              
              <div className="mt-4 d-flex align-items-center justify-content-center gap-2 py-2 small fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Cash on Delivery Available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Themed Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[10000]" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-stone-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">{confirmModal.title}</h3>
            <p className="text-stone-500 mb-8 max-w-[280px]">{confirmModal.message}</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, show: false }));
                }}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
              >
                Yes, Continue
              </button>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="w-full py-4 bg-white text-stone-500 rounded-2xl font-semibold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
