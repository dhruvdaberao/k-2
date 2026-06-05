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
      <style>{`
        .sticky-bar-wrapper {
          bottom: calc(env(safe-area-inset-bottom) + 60px);
        }
        @media (min-width: 768px) {
          .sticky-bar-wrapper {
            bottom: 0;
          }
        }
      `}</style>
      <div 
        className={`fixed left-0 right-0 transition-transform duration-300 ease-in-out border-t border-[rgba(139,94,60,0.15)] shadow-[0_-8px_20px_rgba(0,0,0,0.06)] sticky-bar-wrapper`}
        style={{
          zIndex: 1300, 
          background: 'rgba(253, 251, 247, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transform: isVisible ? 'translateY(0)' : 'translateY(150%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          
          {/* Actions: Exactly matching the Product Page UI */}
          <div className="flex items-center gap-3 w-full">
             {disabled ? (
                <button
                  disabled
                  className="w-full rounded-xl h-[54px] opacity-60 font-bold border-none text-[16px] md:text-lg"
                  style={{ backgroundColor: "#8B7355", color: "#F5EFE6", cursor: "not-allowed" }}
                >
                  Out of Stock
                </button>
             ) : (
                <>
                  <button
                    className="flex-1 font-bold text-[16px] md:text-lg transition-transform hover:scale-[1.02] active:scale-[0.96] shadow-sm"
                    style={{ backgroundColor: '#4A3219', color: '#FDFBF7', border: 'none', height: '54px', minHeight: '54px', borderRadius: '20px', WebkitAppearance: 'none' }}
                    onClick={() => {
                        document.getElementById('product-main-buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    Buy Now
                  </button>

                  {cartQuantity > 0 ? (
                    <div className="flex-1 overflow-hidden hover:scale-[1.02] transition-transform duration-200" style={{ backgroundColor: '#4A3219', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '54px', minHeight: '54px', borderRadius: '20px' }}>
                      <button
                        onClick={handleDecrease}
                        className="active:scale-75 transition-transform duration-100 flex items-center justify-center w-14 h-full"
                        style={{ background: 'transparent', border: 'none', color: '#FDFBF7', fontSize: '1.8rem', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none' }}
                      >
                        −
                      </button>
                      <span className="text-[1.2rem] md:text-[1.4rem]" style={{ color: '#FDFBF7', fontWeight: 'bold', userSelect: 'none' }}>
                        {cartQuantity}
                      </span>
                      <button
                        onClick={handleIncrease}
                        className="active:scale-75 transition-transform duration-100 flex items-center justify-center w-14 h-full"
                        style={{ background: 'transparent', border: 'none', color: '#FDFBF7', fontSize: '1.8rem', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none' }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex-1 font-bold text-[16px] md:text-lg transition-transform hover:scale-[1.02] active:scale-[0.96] shadow-sm"
                      onClick={onAddToCart}
                      style={{ backgroundColor: '#4A3219', color: '#FDFBF7', border: 'none', height: '54px', minHeight: '54px', borderRadius: '20px', WebkitAppearance: 'none' }}
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
