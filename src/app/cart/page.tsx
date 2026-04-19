// app/cart/page.tsx
"use client";

import { clearCart } from "@/lib/bags";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import products from "@/data/products.json"; 
import { showToast } from "@/components/Toast";
import PriceProgressBar from "@/components/PriceProgressBar";
import type { Product } from "@/types";

export default function CartPage() {
  const { cartItems, loadCart, removeFromCart, updateQuantity } = useCart();
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
    <main className="cart-page py-8 px-4 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Compact Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-serif text-[#2f2a26] mb-1">
            Your Cart ({itemCount} items)
          </h1>
          <p className="text-stone-500 italic text-sm">Each piece is made to order with care</p>
        </header>

        {/* Layout Grid - more balanced for compact view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main List (Left 7/12) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-[#eadfcd] p-5 shadow-sm">
              <PriceProgressBar subtotal={subtotal} />
            </div>

            {/* Cart Items List - Image 5 Style */}
            <div className="bg-white rounded-xl border border-[#eadfcd] overflow-hidden shadow-sm">
              {cartItems.map((it, idx) => (
                <div 
                  key={it.id} 
                  className={`p-4 flex items-center gap-4 ${idx !== cartItems.length - 1 ? 'border-b border-stone-100' : ''}`}
                >
                  {/* Thumbnail Row */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-stone-50 rounded-lg overflow-hidden border border-stone-100 relative">
                    <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Core Info Row */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-[#2f2a26] leading-tight mb-1">
                        {it.name.split(" - ")[0]}
                      </h3>
                      
                      {/* Quantity Picker Pill - Image 5 Style */}
                      <div className="inline-flex items-center bg-[var(--brand)] rounded-[8px] p-1 scale-90 origin-left">
                        <button 
                          onClick={async () => it.quantity <= 1 ? (confirm("Remove item?") && await removeFromCart(it.id)) : await updateQuantity(it.id, it.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 transition-all text-lg font-bold"
                        >
                          &minus;
                        </button>
                        <span className="w-6 text-center text-white font-bold text-sm">{it.quantity}</span>
                        <button 
                          onClick={async () => await updateQuantity(it.id, it.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 transition-all text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-32">
                      <div className="text-base font-bold text-[#2f2a26]">₹{it.price}</div>
                      <button 
                        onClick={async () => confirm("Remove item?") && await removeFromCart(it.id)}
                        className="text-[10px] font-bold text-red-500 uppercase tracking-tighter border border-red-200 px-2 py-0.5 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear All Footer */}
            <button 
              onClick={async () => confirm("Clear all items?") && await clearCart()}
              className="w-full py-3 text-xs font-bold text-stone-400 uppercase tracking-widest bg-white border border-[#eadfcd] rounded-lg hover:text-red-500 hover:border-red-200 transition-all"
            >
              Clear All Items
            </button>
          </div>

          {/* Sidebar (Right 5/12) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-[#eadfcd] p-6 shadow-md">
              <h3 className="font-bold text-xl text-[#2f2a26] mb-6 pb-3 border-b border-stone-50">Order Summary</h3>
              
              <div className="space-y-4 text-sm text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#2f2a26]">₹{subtotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-[#2f2a26]">₹{baseShipping}</span>
                </div>

                {shippingDiscount < 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Shipping Discount</span>
                    <span>-₹{Math.abs(shippingDiscount)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#C2410C] font-bold">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                
                <div className="h-px bg-stone-100 my-4" />
                
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg text-[#2f2a26]">Total</span>
                  <span className="font-bold text-2xl text-[var(--brand)]">₹{grandTotal}</span>
                </div>
              </div>

              <NextLink href="/checkout" className="w-full btn-primary py-4 text-center block rounded-[8px] mt-8 font-bold text-base shadow-lg transition-transform active:scale-95">
                Checkout
              </NextLink>
              
              <div className="mt-6 flex items-center justify-center gap-3 py-2 bg-[#FAF7F2] rounded-lg text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Cash on Delivery Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
