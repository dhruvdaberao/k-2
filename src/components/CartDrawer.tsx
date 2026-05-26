"use client";

import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CartDrawer() {
  const { cartItems, isCartDrawerOpen, setIsCartDrawerOpen, updateQuantity, removeFromCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartDrawerOpen]);

  if (!mounted) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity duration-300 ${isCartDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsCartDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-[#FAF7F2] z-[10000] shadow-2xl transition-transform duration-300 transform flex flex-col ${isCartDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-white">
          <h2 className="text-xl font-serif font-bold text-[#4A3219]">Your Cart ({cartItems.length})</h2>
          <button 
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors bg-stone-100 hover:bg-stone-200 rounded-full"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                <path d="M3 6h18"></path>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <p className="text-lg font-bold text-[#4A3219] mb-1">Your cart is empty</p>
              <p className="text-stone-500 text-sm">Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => setIsCartDrawerOpen(false)}
                className="mt-6 text-[#8B7355] font-bold hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-white rounded-xl shadow-sm border border-stone-100">
                  <div className="relative w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image 
                      src={item.image || "/placeholder.png"} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-[#2f2a26] line-clamp-2 pr-2">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[#8B7355]">₹{item.price}</span>
                      
                      {/* Qty Controls */}
                      <div className="flex items-center bg-stone-100 rounded-full border border-stone-200">
                        <button 
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-black transition-colors"
                          onClick={() => {
                            if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
                            else removeFromCart(item.id);
                          }}
                        >
                          &minus;
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button 
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-black transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-white border-t border-stone-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-stone-500 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-[#2f2a26]">₹{totalAmount}</span>
            </div>
            <p className="text-xs text-stone-400 mb-4 text-center">Shipping & taxes calculated at checkout</p>
            
            <div className="flex flex-col gap-3">
              <Link 
                href="/cart" 
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full py-3.5 bg-[#4A3219] hover:bg-[#2f2a26] text-[#FDFBF7] text-center font-bold rounded-full transition-colors shadow-md"
              >
                View Full Cart
              </Link>
              <button 
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full py-3 bg-transparent text-[#8B7355] font-bold rounded-full transition-colors hover:bg-stone-100"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
