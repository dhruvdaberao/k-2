"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { trackEvent } from "@/lib/analytics";
import { setDirectCheckoutItem } from "@/lib/directCheckout";
import Image from "next/image";

export default function StickyBuyBar({
  slug, title, price, image, disabled = false, isVisible
}: {
  slug: string; title: string; price: number; image?: string;
  disabled?: boolean; isVisible: boolean;
}) {
  const router = useRouter();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cartItems.find((x) => x.id === slug);
  const cartQuantity = cartItem?.quantity || 0;

  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  async function onAddToCart() {
    if (disabled) {
      setShowOutOfStockModal(true);
      return;
    }
    await addToCart({ id: slug, slug, title, price, image: image || "/placeholder.png" });
    trackEvent({ action: "add_to_cart", category: "Ecommerce", label: title, value: price, location: "sticky_bar" });
  }

  async function handleIncrease() {
    await updateQuantity(slug, cartQuantity + 1);
  }

  async function handleDecrease() {
    if (cartQuantity <= 1) await removeFromCart(slug);
    else await updateQuantity(slug, cartQuantity - 1);
  }

  // Mobile layout: Sticky bar sits just above bottom nav (env(safe-area-inset-bottom) + ~60px)
  // Desktop layout: sits at the very bottom.
  return (
    <>
      <div 
        className={`fixed left-0 right-0 transition-transform duration-300 ease-in-out border-t border-[rgba(139,94,60,0.15)] shadow-[0_-8px_20px_rgba(0,0,0,0.06)] bottom-[60px] md:bottom-0`}
        style={{
          zIndex: 900, // Below full-screen modals, but above everything else
          background: 'rgba(253, 251, 247, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: isVisible ? 'translateY(0)' : 'translateY(150%)',
          paddingBottom: 'env(safe-area-inset-bottom)', 
        }}
      >
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-3">
          
          {/* Left: Product Info (Visible on mobile too, but compact) */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {image && (
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-md md:rounded-lg overflow-hidden shrink-0 border border-[rgba(139,94,60,0.2)] shadow-sm">
                <Image src={image} alt={title} width={56} height={56} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="font-bold text-[#4A3219] truncate text-sm md:text-base">{title}</span>
              <span className="font-bold text-[var(--brand)] text-sm">₹{price}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-1 md:flex-none justify-end w-full">
             {disabled ? (
                <button
                  disabled
                  className="w-full rounded-xl h-[44px] md:h-[54px] opacity-60 font-bold border-none text-[13px] md:text-base"
                  style={{ backgroundColor: "#8B7355", color: "#F5EFE6", cursor: "not-allowed" }}
                >
                  Out of Stock
                </button>
             ) : (
                <>
                  <button
                    className="flex-1 md:w-[160px] rounded-[10px] md:rounded-xl h-[44px] md:h-[54px] font-bold text-[13px] md:text-base transition-transform hover:scale-[1.02] active:scale-[0.96] border-[1.5px] border-[#4A3219] whitespace-nowrap px-1"
                    style={{ backgroundColor: 'transparent', color: '#4A3219' }}
                    onClick={() => {
                        document.getElementById('product-main-buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    Buy Now
                  </button>

                  {cartQuantity > 0 ? (
                    <div className="flex-1 md:w-[160px] h-[44px] md:h-[54px] rounded-[10px] md:rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-200" style={{ backgroundColor: '#4A3219', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        onClick={handleDecrease}
                        className="active:scale-75 transition-transform duration-100 flex items-center justify-center w-8 md:w-12 h-full"
                        style={{ background: 'transparent', border: 'none', color: '#FDFBF7', fontSize: '1.4rem', cursor: 'pointer', outline: 'none' }}
                      >
                        −
                      </button>
                      <span className="text-[0.9rem] md:text-[1.1rem]" style={{ color: '#FDFBF7', fontWeight: 'bold', userSelect: 'none' }}>
                        {cartQuantity}
                      </span>
                      <button
                        onClick={handleIncrease}
                        className="active:scale-75 transition-transform duration-100 flex items-center justify-center w-8 md:w-12 h-full"
                        style={{ background: 'transparent', border: 'none', color: '#FDFBF7', fontSize: '1.4rem', cursor: 'pointer', outline: 'none' }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex-1 md:w-[160px] rounded-[10px] md:rounded-xl h-[44px] md:h-[54px] font-bold text-[13px] md:text-base transition-transform hover:scale-[1.02] active:scale-[0.96] shadow-sm whitespace-nowrap px-1"
                      onClick={onAddToCart}
                      style={{ backgroundColor: '#4A3219', color: '#FDFBF7', border: 'none' }}
                    >
                      Add to Bag
                    </button>
                  )}
                </>
             )}
          </div>

        </div>
      </div>

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
    </>
  );
}
