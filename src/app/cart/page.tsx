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
    <main className="cart-page py-12 px-4 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Centered Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-serif text-[#2f2a26] mb-2">
            Shopping Cart
          </h1>
          <div className="flex items-center justify-center gap-2 text-stone-500">
             <span className="bg-[#2f2a26] text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
             <span className="italic text-sm">Made to order with care</span>
          </div>
        </header>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl border border-[#eadfcd] p-6 shadow-sm">
              <PriceProgressBar subtotal={subtotal} />
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cartItems.map((it) => {
                console.log("[CartUI] Rendering item:", it.id);
                return (
                  <div key={it.id} className="bg-white rounded-2xl border border-[#eadfcd] p-4 shadow-sm group hover:border-[#C2410C] transition-colors">
                    <div className="flex items-center gap-4 sm:gap-6">
                      {/* Item Image */}
                      <NextLink href={`/products/${it.id}`} className="block flex-shrink-0">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 relative">
                          <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                        </div>
                      </NextLink>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <h3 className="text-lg font-bold text-[#2f2a26] line-clamp-1 mb-1">
                                 <NextLink href={`/products/${it.id}`} className="hover:text-[#C2410C] transition-colors">{it.name.split(" - ")[0]}</NextLink>
                              </h3>
                              <p className="text-[#C2410C] font-bold text-lg">₹{it.price}</p>
                           </div>
                           <div className="hidden sm:block text-xl font-bold text-[#2f2a26]">₹{it.price * it.quantity}</div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                           {/* Quantity Pill - Image 3/4 style */}
                           <div className="flex items-center bg-[#2f2a26] rounded-full p-1 shadow-sm">
                              <button 
                                onClick={async () => it.quantity <= 1 ? (confirm("Remove item?") && await removeFromCart(it.id)) : await updateQuantity(it.id, it.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-stone-700 rounded-full font-bold transition-all text-xl"
                                aria-label="Decrease quantity"
                              >
                                &minus;
                              </button>
                              <span className="w-8 text-center text-white font-bold text-base select-none">{it.quantity}</span>
                              <button 
                                onClick={async () => await updateQuantity(it.id, it.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-stone-700 rounded-full font-bold transition-all text-xl"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                           </div>

                           {/* Remove Button - Pill style on right */}
                           <button 
                             onClick={async () => {
                               if (confirm("Remove this item from your cart?")) {
                                 await removeFromCart(it.id);
                                 showToast("Item removed");
                               }
                             }} 
                             className="border-2 border-[#ef4444] text-[#ef4444] px-6 py-1.5 rounded-full text-sm font-bold hover:bg-[#ef4444] hover:text-white transition-all whitespace-nowrap"
                           >
                             Remove
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear All Button */}
            <button 
              onClick={async () => {
                if (confirm("Clear your entire shopping bag?")) {
                  await clearCart();
                  showToast("Cart cleared");
                }
              }} 
              className="w-full bg-white border border-stone-200 text-stone-500 py-4 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-50 hover:text-[#ef4444] hover:border-[#ef4444] transition-all"
            >
              Clear Shopping Bag
            </button>
          </div>

          {/* Sticky Order Summary (Right) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#eadfcd] p-8 shadow-md sticky top-24">
              <h3 className="font-bold text-2xl text-[#2f2a26] mb-8 pb-4 border-b border-stone-100">Order Summary</h3>
              
              <div className="space-y-5 text-base text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#2f2a26]">₹{subtotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-[#2f2a26]">₹{baseShipping}</span>
                </div>

                {shippingDiscount < 0 && (
                  <div className="flex justify-between text-green-700 font-semibold bg-green-50 px-3 py-2 rounded-lg -mx-3">
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Free Shipping
                    </span>
                    <span>-₹{Math.abs(shippingDiscount)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#C2410C] font-bold bg-[#FFF7ED] px-3 py-2 rounded-lg -mx-3">
                    <span>Order Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                
                <div className="h-px bg-stone-100 my-6" />
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-stone-400 text-sm font-medium">Total Amount</span>
                    <span className="font-bold text-lg text-[#2f2a26]">Grand Total</span>
                  </div>
                  <span className="font-bold text-4xl text-[#C2410C]">₹{grandTotal}</span>
                </div>
              </div>

              <NextLink href="/checkout" className="w-full btn-primary py-5 text-center block rounded-xl shadow-xl mt-10 font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95">
                Proceed to Checkout
              </NextLink>
              
              <div className="mt-6 flex items-center justify-center gap-4 text-stone-400">
                 <div className="flex flex-col items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Secure</span>
                 </div>
                 <div className="w-px h-8 bg-stone-100" />
                 <div className="flex flex-col items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Handmade</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
