// components/ProductCard.tsx
"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import Link from "next/link";
import { useEffect, useState, MouseEvent } from "react";
import type { Product } from "@/types";
import { toggleWishlist } from "@/lib/bags";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function ProductCard({ p }: { p: Product }) {
  const { user } = useAuth();
  const [hearted, setHearted] = useState(false);
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  // Initialize "hearted" from storage on mount or slug change
  useEffect(() => {
    try {
      const slugs = JSON.parse(localStorage.getItem("wishlist:v1") || "[]") as string[];
      setHearted(slugs.includes(p.slug));
    } catch {
      // ignore
    }
  }, [p.slug]);

  const encoded = encodeURIComponent(p.slug);
  const inStock = typeof p.stock === "number" ? p.stock > 0 : true;
  const isCustomOrder = p.type === "custom-order";

  // Resolve badges: prioritize array, fallback to single string, or compute from logic
  const badges = p.badges && p.badges.length > 0 ? p.badges : (p.badge ? [p.badge] : []);

  // Resolve price display
  const priceDisplay = isCustomOrder
    ? (p.priceLabel || `Starts at ₹${p.minPrice || p.price}`)
    : `₹${p.price}`;

  const onHeartClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(p);
    setHearted(next);
  };

  const handleAction = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCustomOrder) {
      // Enquire action
      const message = encodeURIComponent(`Hi! I'm interested in ${p.title}`);
      const url = p.cta?.url || `https://ig.me/m/keshvi_crafts`;
      window.open(url, "_blank", "noopener,noreferrer");
      trackEvent({
        action: "click_instagram_enquiry",
        category: "Card",
        label: p.title,
        location: "card",
        slug: p.slug
      });
    } else {
      // Add to Cart action
      addToCart(p);
    }
  };

  const handleCardClick = (e: MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest("button")) {
      e.preventDefault();
      return;
    }
  };

  const getButtonLabel = () => {
    if (isCustomOrder) return "Enquire on Instagram";
    return "Add to Cart";
  };

  const cartItem = cartItems.find((it) => it.id === p.id);

  const visibleBadges = badges.slice(0, 2);
  const overflowCount = badges.length - 2;

  return (
    <article className="plp-card-mobile h-full flex flex-col relative group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300">

      {/* MEDIA WRAPPER */}
      <div className="relative w-full bg-stone-100 overflow-hidden">
        <Link
          href={`/products/${encoded}`}
          aria-label={p.title}
          className="block w-full h-full"
          onClick={handleCardClick}
        >
          {/* Square Aspect Ratio */}
          <div className="relative w-full h-0" style={{ paddingBottom: '100%' }}>
            <ImageWithFallback
              src={p.images?.[0] || '/placeholder.png'}
              alt={p.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
              draggable={false}
              loading="lazy"
            />
          </div>
        </Link>

        {/* Wishlist Button - Restored */}
        <button
          className={`absolute top-3 right-3 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 border border-stone-200/50 force-visible ${hearted
            ? "bg-white text-red-600"
            : "bg-white/95 text-neutral-500 hover:text-red-500"
            }`}
          style={{
            width: '40px',
            height: '40px',
            zIndex: 20, // Clean z-index
            pointerEvents: 'auto',
          }}
          onClick={onHeartClick}
          aria-label={hearted ? "Remove from wishlist" : "Add to wishlist"}
          type="button"
          title={hearted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {hearted ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          )}
        </button>

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 pointer-events-none max-w-[80%]">
          {!inStock && !isCustomOrder && (
            <span className="px-2 py-1 text-[10px] font-bold bg-neutral-900 text-white rounded shadow-sm">Out of Stock</span>
          )}
          {/* Auto-badge for custom order if not present */}
          {isCustomOrder && !badges.includes("Made to Order") && (
            <span className="px-2 py-1 text-[10px] font-semibold bg-[#C2410C] text-white backdrop-blur-sm rounded shadow-sm">
              Made to Order
            </span>
          )}
          {visibleBadges.map(b => (
            <span key={b} className={`px-2 py-1 text-[10px] font-semibold backdrop-blur-sm rounded shadow-sm border ${b === "Bestseller"
              ? "bg-[#2C1810] text-white border-[#2C1810]"
              : "bg-white/90 text-neutral-800 border-neutral-100"
              }`}>
              {b}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="px-2 py-1 text-[10px] font-semibold bg-white/90 text-neutral-600 backdrop-blur-sm rounded shadow-sm border border-neutral-100">
              +{overflowCount}
            </span>
          )}
        </div>

      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-grow p-4">
        <h3 className="text-base font-medium text-neutral-900 leading-snug mb-2 line-clamp-2 min-h-[2.5em]">
          <Link href={`/products/${encoded}`} onClick={handleCardClick} className="product-title-link">
            {p.title}
          </Link>
        </h3>

        <div className="mt-auto">

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-neutral-900">{priceDisplay}</span>
          </div>

          {cartItem && !isCustomOrder ? (
            <div className="qty-pill-brand w-100 justify-content-between p-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cartItem.quantity <= 1 ? removeFromCart(p.id || p.slug) : updateQuantity(p.id || p.slug, cartItem.quantity - 1);
                }}
                aria-label="Decrease quantity"
              >
                &minus;
              </button>
              <span className="select-none">{cartItem.quantity}</span>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(p.id || p.slug, cartItem.quantity + 1);
                }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAction}
              disabled={(!inStock && !isCustomOrder)}
              className={`w-full ${isCustomOrder ? "btn-secondary" : "btn-primary"} h-[52px] font-bold`}
            >
              {getButtonLabel()}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
