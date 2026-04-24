// components/ProductCard.tsx
"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import Link from "next/link";
import { useEffect, useState, MouseEvent } from "react";
import type { Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getProductRating } from "@/lib/ratingUtils";

export default function ProductCard({ p }: { p: Product }) {
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const router = useRouter();

  const [isPopping, setIsPopping] = useState(false);
  const [ratingData, setRatingData] = useState<{ avg: string | null; count: number }>({ avg: null, count: 0 });

  useEffect(() => {
    async function loadRating() {
      const result = await getProductRating(p.id || p.slug);
      setRatingData(result);
    }
    loadRating();
  }, [p.id, p.slug]);

  const isHearted = isWishlisted(p.id || p.slug);

  const encoded = encodeURIComponent(p.slug);
  const inStock = typeof p.stock === "number" ? p.stock > 0 : true;
  const isCustomOrder = p.type === "custom-order";

  // Resolve badges: prioritize array, fallback to single string, or compute from logic
  const badges = p.badges && p.badges.length > 0 ? p.badges : (p.badge ? [p.badge] : []);

  // Resolve price display
  const priceDisplay = isCustomOrder
    ? (p.priceLabel || `Starts at ₹${p.minPrice || p.price}`)
    : `₹${p.price}`;


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
    <article className="relative plp-card-mobile h-full flex flex-col group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300">

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

        {/* Wishlist Button - Direct SVG for visibility */}
        <div 
          className="absolute top-3 right-3 cursor-pointer z-10 p-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsPopping(true);
            setTimeout(() => setIsPopping(false), 400);
            toggleWishlist(p);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill={isHearted ? "red" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="red"
            className={`w-6 h-6 transition-all duration-200 hover:scale-110 active:scale-95 ${isPopping ? 'animate-heart-pop' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.015-4.5-4.5-4.5-1.74 0-3.255 1.007-4.5 2.09-1.245-1.083-2.76-2.09-4.5-2.09C5.015 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>

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

          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-neutral-900">{priceDisplay}</span>
            <div 
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/reviews/${p.id || p.slug}`);
              }}
            >
              {ratingData.count === 0 ? (
                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium whitespace-nowrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#aaa" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  No reviews
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[#5a3e2b] whitespace-nowrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span className="font-bold text-base">{ratingData.avg}</span>
                </div>
              )}
            </div>
          </div>

          {cartItem && !isCustomOrder ? (
            <div className="qty-pill-brand w-full">
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
              className={`w-full ${isCustomOrder ? "btn-secondary" : "btn-primary"} font-bold`}
            >
              {getButtonLabel()}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
