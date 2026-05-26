"use client";

import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

export default function MiniCartDrawer() {
  const { isCartDrawerOpen, closeCartDrawer, cartItems, updateQuantity, removeFromCart } = useCart();

  // Prevent background scrolling when open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCartDrawer}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 z-[101] w-full max-w-md h-full bg-[#f1ebe6] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e6ded4] bg-white">
          <h2 className="text-xl font-serif font-bold text-[#2f2a26]">Your Cart</h2>
          <button 
            onClick={closeCartDrawer}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2f2a26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="text-lg font-medium text-[#2f2a26]">Your cart is empty</p>
              <button onClick={closeCartDrawer} className="mt-4 text-[#4A3219] font-bold underline">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 bg-stone-200 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-[#2f2a26] text-sm leading-tight">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-red-500 p-1"
                        aria-label="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-[#e6ded4] rounded bg-white">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2 py-1 text-[#2f2a26] hover:bg-stone-100"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-[#2f2a26] hover:bg-stone-100"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-[#4A3219]">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-[#e6ded4] p-5 bg-white space-y-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center text-lg font-bold text-[#2f2a26]">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <p className="text-sm text-stone-500 text-center">Shipping & taxes calculated at checkout</p>
            <div className="flex gap-3">
              <Link 
                href="/cart" 
                onClick={closeCartDrawer}
                className="flex-1 text-center py-3 border border-[#4A3219] text-[#4A3219] font-bold rounded-full hover:bg-stone-50 transition-colors"
              >
                View Cart
              </Link>
              <Link 
                href="/checkout" 
                onClick={closeCartDrawer}
                className="flex-1 text-center py-3 bg-[#4A3219] text-[#f1ebe6] font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
