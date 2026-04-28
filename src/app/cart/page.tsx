// app/cart/page.tsx
"use client";

import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import products from "@/data/products.json"; 
import { showToast } from "@/components/Toast";
import PriceProgressBar from "@/components/PriceProgressBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Product } from "@/types";

import NextImage from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function CartPage() {
  const { cartItems, loadCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Modal state for confirmations
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadCart();
      setLoading(false);
    };

    init();
  }, [loadCart]);

  // Select all items whenever cart changes
  useEffect(() => {
    setSelectedItems(cartItems.map((it) => it.id));
  }, [cartItems]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((it) => it.id));
    }
  };

  // Only compute totals from SELECTED items
  const selectedCartItems = cartItems.filter((it) => selectedItems.includes(it.id));
  const subtotal = selectedCartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const itemCount = selectedCartItems.reduce((n, it) => n + it.quantity, 0);

  // Discount Logic
  const discountableSubtotal = selectedCartItems.reduce((s, it) => {
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

  const handleQuantityUpdate = async (id: string, newQuantity: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateQuantity(id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
        <div className="container" style={{ maxWidth: '900px' }}>
          <header className="mb-8 text-center pt-2">
            <div className="h-8 w-32 bg-stone-200 animate-pulse rounded-md mx-auto mb-1"></div>
          </header>
          <div className="row g-4 items-start">
            <div className="col-12 col-lg-7">
              <div className="flex flex-col gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="cart-item-row-refined shadow-sm animate-pulse opacity-60">
                    <div className="w-[84px] h-[84px] bg-stone-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-center gap-3 py-2">
                      <div className="h-4 w-3/4 bg-stone-200 rounded"></div>
                      <div className="h-6 w-20 bg-stone-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="h-64 w-full bg-stone-200 rounded-2xl animate-pulse opacity-60"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
      <div className="container">
        {/* Header - left-aligned matching Wishlist */}
        <header className="mb-8 pt-2">
          <h1 className="text-3xl font-serif font-bold text-[#2f2a26]">Cart</h1>
        </header>

        {cartItems.length === 0 ? (
          /* Minimalist Empty State - Matching Wishlist Style */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-md mx-auto">
            <div className="mb-8 opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12"/>
              </svg>
            </div>
            
            <h2 className="text-2xl font-serif font-bold text-[#2f2a26] mb-3">Your cart is empty</h2>
            
            <p className="text-stone-500 mb-10 text-sm italic">
              Looks like you haven't found your perfect piece yet.
            </p>
            
            <NextLink 
              href="/collections" 
              className="btn btn-primary px-10 py-3 rounded-full font-bold shadow-sm"
              style={{ minWidth: '220px' }}
            >
              Browse Collections
            </NextLink>
          </div>
        ) : (
          <div className="row g-4 items-start" style={{ pointerEvents: isUpdating ? 'none' : 'auto' }}>
            {/* Main List (Left) */}
            <div className="col-12 col-lg-7">
              <PriceProgressBar subtotal={subtotal} />

              {/* Select All */}
              <label className="cart-select-all">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                  onChange={toggleAll}
                  className="cart-checkbox"
                />
                <span>Select All ({cartItems.length})</span>
              </label>

              <div className="cart-list-wrapper">
                {cartItems.map((it) => (
                  <div key={it.id} className={`cart-item-row-refined shadow-sm${selectedItems.includes(it.id) ? " cart-item--selected" : ""}`}>
                    {/* Left: Thumbnail */}
                    <div className="cart-item-thumbnail relative" style={{ width: 72, height: 72 }}>
                      <NextImage src={it.image} alt={it.name} fill style={{ objectFit: 'cover' }} sizes="72px" />
                    </div>

                    {/* Center: Details & Picker */}
                    <div className="cart-item-info-center">
                      <h3 className="cart-item-name">{it.name.split(" - ")[0]}</h3>
                      <div className="qty-pill-brand-mini">
                        <button onClick={async () => {
                          if (it.quantity <= 1) {
                            setRemoveTarget({ id: it.id, name: it.name });
                          } else {
                            await handleQuantityUpdate(it.id, it.quantity - 1);
                          }
                        }}>&minus;</button>
                        <span key={it.quantity}>{it.quantity}</span>
                        <button onClick={() => handleQuantityUpdate(it.id, it.quantity + 1)}>+</button>
                      </div>
                    </div>

                    {/* Right: Price, Checkbox & Remove */}
                    <div className="cart-item-actions-right">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(it.id)}
                          onChange={() => toggleItem(it.id)}
                          className="cart-checkbox"
                        />
                        <div className="cart-item-price-main font-serif">₹{it.price * it.quantity}</div>
                      </div>
                      <div className="cart-item-bottom-actions">
                        <button onClick={() => setRemoveTarget({ id: it.id, name: it.name })} className="cart-remove-btn">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear All Footer */}
              <div className="text-center mt-4">
                <button 
                  onClick={() => setShowClearAll(true)}
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
                    <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
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

                {user ? (
                  <NextLink
                    href="/checkout"
                    className={`btn btn-primary w-100 py-3 mt-4 fw-bold shadow-sm${selectedItems.length === 0 ? " disabled opacity-50 pe-none" : ""}`}
                    aria-disabled={selectedItems.length === 0}
                    onClick={(e) => { if (selectedItems.length === 0) e.preventDefault(); }}
                  >
                    {selectedItems.length === 0 ? "Select items to checkout" : `Checkout (${itemCount})`}
                  </NextLink>
                ) : (
                  <div className="flex flex-col gap-3 mt-4">
                    <NextLink
                      href="/auth"
                      className={`btn btn-primary w-100 py-3 fw-bold shadow-sm${selectedItems.length === 0 ? " disabled opacity-50 pe-none" : ""}`}
                      aria-disabled={selectedItems.length === 0}
                      onClick={(e) => { if (selectedItems.length === 0) e.preventDefault(); }}
                    >
                      Login / Signup
                    </NextLink>
                    <NextLink
                      href="/checkout?guest=true"
                      className={`btn btn-primary w-100 py-3 fw-bold shadow-sm${selectedItems.length === 0 ? " disabled opacity-50 pe-none" : ""}`}
                      style={{ background: "transparent", color: "var(--brand)", border: "2px solid var(--brand)", boxShadow: 'none' }}
                      aria-disabled={selectedItems.length === 0}
                      onClick={(e) => { if (selectedItems.length === 0) e.preventDefault(); }}
                    >
                      Continue as Guest
                    </NextLink>
                  </div>
                )}
                
                <div className="mt-4 d-flex align-items-center justify-content-center gap-2 py-2 small fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: "10px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Cash on Delivery Available
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Remove Item Confirmation ── */}
      <ConfirmModal
        isOpen={!!removeTarget}
        title="Remove item?"
        message={removeTarget ? `Remove "${removeTarget.name}" from your bag?` : ""}
        confirmLabel="Remove"
        cancelLabel="Keep"
        destructive
        onConfirm={() => {
          if (removeTarget) {
            removeFromCart(removeTarget.id);
            showToast("Item removed from bag.");
          }
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />

      {/* ── Clear All Confirmation ── */}
      <ConfirmModal
        isOpen={showClearAll}
        title="Clear cart?"
        message="This will remove all items from your shopping bag. This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          clearCart();
          showToast("Cart cleared successfully.");
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
      />
    </main>
  );
}
