// app/cart/page.tsx
"use client";

import { useCart } from "@/hooks/useCart";
import { useCallback, useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { showToast } from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import PriceProgressBar from "@/components/PriceProgressBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Product } from "@/types";

import ImageWithFallback from "@/components/ImageWithFallback";
import { useAuth } from "@/hooks/useAuth";
import EmptyStateRecommendations from "@/components/EmptyStateRecommendations";

export default function CartPage() {
  const { cartItems, loadCart, removeFromCart, updateQuantity, clearCart, loading } = useCart();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Modal state for confirmations
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);
  const [showOutOfStockCartModal, setShowOutOfStockCartModal] = useState(false);
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const fetchControllerRef = useRef(0);

  const cartIdsStr = cartItems.map(it => it.id).sort().join(',');

  const fetchProducts = useCallback(async (ids: string[]) => {
    const reqId = ++fetchControllerRef.current;
    
    try {
      // 5-second timeout for PWA cold start/offline issues
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const uuids = ids.filter(id => uuidRegex.test(id));
      const slugs = ids.filter(id => !uuidRegex.test(id));

      let orFilters = [];
      if (uuids.length > 0) orFilters.push(`id.in.(${uuids.join(',')})`);
      if (slugs.length > 0) orFilters.push(`slug.in.(${slugs.join(',')})`);

      if (orFilters.length === 0) return;

      const fetchPromise = supabase
        .from("products")
        .select("*")
        .or(orFilters.join(','));

      const { data } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (reqId !== fetchControllerRef.current) return;
      if (data) setProducts(data as Product[]);
    } catch (err: any) {
      console.error("Bag product fetch error:", err);
      // Even if fetch fails, we keep the UI working with local cache
    }
  }, []);

  // Fetch products for stock info (non-blocking — cart renders from cached items)
  useEffect(() => {
    if (loading || !cartIdsStr) {
      if (!loading && !cartIdsStr) setProducts([]);
      return;
    }
    fetchProducts(cartIdsStr.split(','));
  }, [loading, cartIdsStr, fetchProducts]);

  // Auto-retry fetch when user returns to the tab (PWA background resume fix)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && cartIdsStr) {
        fetchProducts(cartIdsStr.split(','));
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [cartIdsStr, fetchProducts]);

  // Auto-remove deleted items from cart
  useEffect(() => {
    if (products.length === 0 || cartItems.length === 0) return;
    
    const invalidItems = cartItems.filter(item => {
      return !products.some(p => p.slug === item.id || p.id === item.id);
    });

    if (invalidItems.length > 0) {
      invalidItems.forEach(item => {
        removeFromCart(item.id);
      });
    }
  }, [products, cartItems, removeFromCart]);

  const seenItemsRef = useRef<Set<string>>(new Set());

  // Automatically select items as soon as they appear in the cart (fixes unticked issue on load)
  useEffect(() => {
    const newItems = cartItems.filter(it => !seenItemsRef.current.has(it.id));
    if (newItems.length > 0) {
      setSelectedItems(prev => [...prev, ...newItems.map(it => it.id)]);
      newItems.forEach(it => seenItemsRef.current.add(it.id));
    }
  }, [cartItems]);

  // Automatically unselect items that are out of stock when product data loads
  useEffect(() => {
    if (products.length === 0) return;
    
    setSelectedItems((prev) => {
      return prev.filter(id => {
        const p = (products as Product[]).find(x => x.slug === id || x.id === id);
        const isOos = p && typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order";
        return !isOos;
      });
    });
  }, [products]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const selectableItems = cartItems.filter((it) => {
      const p = (products as Product[]).find(x => x.slug === it.id || x.id === it.id);
      return !(p && typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order");
    });
    
    if (selectedItems.length === selectableItems.length && selectableItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectableItems.map((it) => it.id));
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

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (selectedItems.length === 0) {
      e.preventDefault();
      return;
    }
    
    const outOfStockItems = selectedCartItems.filter((it) => {
      const p = (products as Product[]).find(x => x.slug === it.id || x.id === it.id);
      return p && typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order";
    });

    if (outOfStockItems.length > 0) {
      e.preventDefault();
      setShowOutOfStockCartModal(true);
    }
  };

  // Only block on the useCart hook loading (instant from localStorage cache)
  // Products fetch is non-blocking — it runs silently for stock validation
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setSkeletonTimeout(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setSkeletonTimeout(false);
    }
  }, [loading]);

  if (loading) {
    if (skeletonTimeout) {
      return (
        <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
          <div className="container" style={{ maxWidth: '900px' }}>
            <div className="text-center min-h-[50vh] flex flex-col items-center justify-center">
              <p className="text-stone-500 mb-4">Taking too long to load?</p>
              <button onClick={() => window.location.reload()} className="btn-primary px-8 py-2 rounded-full font-bold">Reload Page</button>
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
        <div className="container" style={{ maxWidth: '900px' }}>
          <header className="mb-8 text-center pt-2">
            <h1 className="collections-title mb-4">Bag</h1>
          </header>
          <div className="row g-4 items-start">
            <div className="col-12 col-lg-7">
              <div className="flex flex-col gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="cart-item-row-refined shadow-sm animate-pulse opacity-60" style={{ backgroundColor: '#F5EFE6', border: '1px solid #E6DCCF' }}>
                    <div className="w-[84px] h-[84px] bg-[#EAE1D3] rounded-xl flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-center gap-3 py-2">
                      <div className="h-4 w-3/4 bg-[#EAE1D3] rounded"></div>
                      <div className="h-6 w-20 bg-[#EAE1D3] rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="h-64 w-full bg-[#EAE1D3] rounded-2xl animate-pulse opacity-60"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page py-4 py-md-5 px-3 bg-[#FAF7F2] min-h-screen">
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Header - centered matching Collections */}
        <header className="mb-8 text-center pt-2">
          <h1 className="collections-title mb-4 text-center">Bag</h1>
        </header>

        {cartItems.length === 0 ? (
          /* Minimalist Empty State */
          <div className="flex flex-col items-center justify-center pt-20 pb-32 text-center px-4 mx-auto w-full">
            <div className="max-w-md w-full flex flex-col items-center">
              <div className="mb-6 relative text-[#4A3219] opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 md:w-28 md:h-28">
                  <rect x="2" y="8" width="20" height="14" rx="2" ry="2" fill="none"/>
                  <path d="M7 11V6a5 5 0 0 1 10 0v5" fill="none"/>
                </svg>
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#2f2a26] mb-3 md:mb-4">Your bag is empty</h2>
              
              <p className="text-stone-500 mb-8 text-sm md:text-lg lg:text-xl italic">
                Looks like you haven't found your perfect piece yet.
              </p>
              
              <NextLink 
                href="/collections" 
                className="btn btn-primary px-10 py-3 md:px-14 md:py-4 md:text-xl lg:text-2xl rounded-full font-bold shadow-sm"
                style={{ minWidth: '220px' }}
              >
                Browse Collections
              </NextLink>
            </div>
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
                  checked={
                    cartItems.length > 0 && 
                    selectedItems.length === cartItems.filter((it) => {
                      const p = (products as Product[]).find(x => x.slug === it.id || x.id === it.id);
                      return !(p && typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order");
                    }).length &&
                    selectedItems.length > 0
                  }
                  onChange={toggleAll}
                  className="cart-checkbox"
                />
                <span>Select All Available</span>
              </label>

              <div className="cart-list-wrapper">
                {cartItems.map((it) => {
                  const p = (products as Product[]).find(x => x.slug === it.id || x.id === it.id);
                  const imageUrl = p?.images?.[0] || it.image || "/placeholder.png";
                  return (
                  <div key={it.id} className={`cart-item-row-refined shadow-sm${selectedItems.includes(it.id) ? " cart-item--selected" : ""}`}>
                    {/* Left: Thumbnail */}
                    <NextLink href={`/products/${p?.slug || it.id}`} className="cart-item-thumbnail relative block">
                      <ImageWithFallback src={imageUrl} alt={it.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 1024px) 72px, 120px" />
                    </NextLink>

                    {/* Center: Details & Picker */}
                    <div className="cart-item-info-center">
                      <NextLink href={`/products/${p?.slug || it.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="cart-item-name font-sans hover:text-[#8B5E3C] transition-colors">{(it.name || "Product").split(" - ")[0]}</h3>
                      </NextLink>
                      {p && typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order" ? (
                        <div className="w-full text-center py-1.5 px-3 rounded-full text-sm font-bold mt-2 cursor-not-allowed select-none" style={{ backgroundColor: "#F5EFE6", color: "#8B7355", border: "1px solid #E6DCCF" }}>
                          Out of Stock
                        </div>
                      ) : (
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
                      )}
                    </div>

                    {/* Right: Price, Checkbox & Remove */}
                    <div className="cart-item-actions-right">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(it.id)}
                          onChange={() => toggleItem(it.id)}
                          disabled={p && typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order"}
                          className="cart-checkbox"
                        />
                        <div className="cart-item-price-main font-sans">₹{it.price * it.quantity}</div>
                      </div>
                      <div className="cart-item-bottom-actions">
                        <button onClick={() => setRemoveTarget({ id: it.id, name: it.name })} className="cart-remove-btn">Remove</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
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
            <div className="col-12 col-lg-5 mt-8 lg:mt-0">
              <div className="p-0 max-w-md mx-auto lg:ml-auto lg:mr-0 xl:max-w-[450px]">
                <h3 className="h5 md:text-2xl lg:text-3xl fw-bold text-[#2f2a26] mb-4 pb-3 border-bottom border-light">Order Summary</h3>
                
                <div className="vstack gap-3 md:gap-4 text-sm md:text-base lg:text-lg">
                  <div className="d-flex justify-content-between text-[#2f2a26] font-bold">
                    <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                    <span>₹{subtotal}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between text-[#2f2a26] font-bold">
                    <span>Shipping Fee</span>
                    <span>₹{baseShipping}</span>
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
                  
                  <hr className="my-2 border-stone-300" />
                  
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span className="text-xl md:text-2xl lg:text-3xl font-bold text-[#2f2a26] font-sans mb-0">Total</span>
                    <span className="text-xl md:text-2xl lg:text-3xl font-bold font-sans mb-0" style={{ color: "var(--brand)" }}>₹{grandTotal}</span>
                  </div>
                </div>

                {user ? (
                  <NextLink
                    href="/checkout"
                    className={`btn btn-primary w-100 fw-bold shadow-sm flex items-center justify-center${selectedItems.length === 0 ? " disabled opacity-50 pe-none" : ""}`}
                    aria-disabled={selectedItems.length === 0}
                    onClick={handleCheckoutClick}
                    style={{ minHeight: '54px' }}
                  >
                    {selectedItems.length === 0 ? "Select items to checkout" : `Checkout (${itemCount})`}
                  </NextLink>
                ) : (
                  <div className="flex flex-col gap-3 mt-4">
                    <NextLink
                      href="/auth"
                      className={`btn btn-primary w-100 fw-bold shadow-sm flex items-center justify-center${selectedItems.length === 0 ? " disabled opacity-50 pe-none" : ""}`}
                      aria-disabled={selectedItems.length === 0}
                      onClick={handleCheckoutClick}
                      style={{ minHeight: '54px' }}
                    >
                      Login
                    </NextLink>
                    <NextLink
                      href="/checkout?guest=true"
                      className={`btn btn-primary w-100 fw-bold shadow-sm flex items-center justify-center${selectedItems.length === 0 ? " disabled opacity-50 pe-none" : ""}`}
                      style={{ background: "transparent", color: "var(--brand)", border: "2px solid var(--brand)", boxShadow: 'none', minHeight: '54px' }}
                      aria-disabled={selectedItems.length === 0}
                      onClick={handleCheckoutClick}
                    >
                      New User
                    </NextLink>
                  </div>
                )}
                
                <div className="mt-4 d-flex align-items-center justify-content-center gap-2 py-2 small fw-bold text-secondary text-uppercase tracking-wider" style={{ fontSize: "10px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Secure payments via PayU
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
          showToast("Bag cleared successfully.");
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
      />

      {/* ── Out of Stock Notification ── */}
      <ConfirmModal
        isOpen={showOutOfStockCartModal}
        title="Out of Stock Items"
        message="Some items in your bag are out of stock. Please untick or remove them before checkout."
        confirmLabel="Okay"
        cancelLabel=""
        onConfirm={() => setShowOutOfStockCartModal(false)}
        onCancel={() => setShowOutOfStockCartModal(false)}
      />
    </main>
  );
}
