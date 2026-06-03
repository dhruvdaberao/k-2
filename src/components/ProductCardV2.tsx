"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import Link from "next/link";
import { useState, MouseEvent, useEffect } from "react";
import type { Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { ensureRatingsLoaded, getCachedRating } from "@/lib/ratingCache";
import { showToast } from "@/components/Toast";
import "./ProductCardV2.css";


export default function ProductCardV2({ p, priority = false }: { p: Product, priority?: boolean }) {
    const { user } = useAuth();
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const router = useRouter();

    const [ratingData, setRatingData] = useState<{ avg: string | null; count: number }>(() => getCachedRating(p.id || p.slug));

    useEffect(() => {
        let cancelled = false;
        ensureRatingsLoaded().then(() => {
            if (!cancelled) setRatingData(getCachedRating(p.id || p.slug));
        });
        return () => { cancelled = true; };
    }, [p.id, p.slug]);

    const cartItem = cartItems.find((it) => it.id === (p.id || p.slug));
    const qtyInCart = cartItem ? cartItem.quantity : 0;

    const encoded = encodeURIComponent((p.id || p.slug));
    const inStock = typeof p.stock === "number" ? p.stock > 0 : true;
    const isCustomOrder = p.type === "custom-order";

    const isHearted = isWishlisted(p.id || p.slug);

    // Resolve badges: prioritize array, fallback to single string, or compute from logic
    const badges = p.badges && p.badges.length > 0 ? p.badges : (p.badge ? [p.badge] : []);

    // Resolve price display
    const priceDisplay = isCustomOrder
        ? (p.priceLabel || `Starts at ₹${p.minPrice || p.price}`)
        : `₹${p.price}`;

    const originalPriceDisplay = p.original_price ? `₹${p.original_price}` : null;


    const [isPopping, setIsPopping] = useState(false);

    const handleAction = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inStock) {
            showToast("Item is currently out of stock");
            return;
        }

        if (isCustomOrder) {
            // Enquire action
            const messageText = `Hi Keshvi Crafts! I would like to enquire about this product: ${p.title} (https://keshvicrafts.in/products/${p.id || p.slug})`;
            
            const encodedMessage = encodeURIComponent(messageText);
            const url = `https://wa.me/917310045515?text=${encodedMessage}`;
            window.open(url, "_blank", "noopener,noreferrer");

            trackEvent({
                action: "click_whatsapp_enquiry",
                category: "Card",
                label: p.title,
                location: "card",
                slug: (p.id || p.slug)
            });
        } else {
            // Add to Cart action
            addToCart(p);
        }
    };

    const handleCardClick = (e: MouseEvent) => {
        // Don't navigate if clicking on buttons
        if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("svg")) {
            e.preventDefault();
            return;
        }
    };

    const getButtonLabel = () => {
        if (!inStock) return "Out of Stock";
        if (isCustomOrder) return "Enquire";
        return "Add to Bag";
    };

    const visibleBadges = badges.slice(0, 2);
    const overflowCount = badges.length - 2;

    return (
        <article className="relative plp-card-mobile plp-card h-full flex flex-col group overflow-hidden transition-all duration-300" style={{ backgroundColor: '#F5EFE6' }}>

            {/* MEDIA WRAPPER - Relative container for Image + Badges + Heart */}
            <div className="relative w-full bg-stone-100 overflow-hidden">

                <Link
                    href={`/products/${encoded}`}
                    aria-label={p.title}
                    className="block w-full h-full"
                    onClick={handleCardClick}
                >
                    {/* Aspect Ratio Container */}
                    <div className="relative w-full aspect-square overflow-hidden">
                        <ImageWithFallback
                            src={p.images?.[0] || '/placeholder.png'}
                            alt={p.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            draggable={false}
                            priority={priority}
                            loading={priority ? "eager" : "lazy"}
                        />
                    </div>
                </Link>

                {/* Wishlist Button - Direct SVG for visibility */}
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
                        fill={isHearted ? "#C84C35" : "rgba(0,0,0,0.15)"}
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke={isHearted ? "#C84C35" : "white"}
                        className={`w-6 h-6 transition-all duration-200 hover:scale-110 active:scale-90 drop-shadow-md ${isPopping ? 'animate-heart-pop' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.19 5.01a5.72 5.72 0 0 0-8.09 0L12 6.12l-1.1-1.1a5.72 5.72 0 0 0-8.09 8.09l1.1 1.1L9.92 20.22a2.94 2.94 0 0 0 4.16 0L20.09 14.21l1.1-1.1a5.72 5.72 0 0 0 0-8.1z" />
                    </svg>
                </div>

                {/* Discount Badge */}
                {p.discount_badge && (
                    <div className="absolute top-3 left-3 bg-[#C84C35] text-white text-xs font-bold px-2 py-1 rounded-sm z-10 shadow-sm uppercase">
                        {p.discount_badge}
                    </div>
                )}

            </div>

            {/* CONTENT */}
            <div className="flex flex-col flex-grow p-3 md:p-4" style={{ backgroundColor: '#F5EFE6' }}>
                <h3 className="text-sm md:text-base font-bold text-[#2F2A26] leading-snug mb-1 line-clamp-1">
                    <Link href={`/products/${encoded}`} onClick={handleCardClick} className="product-title-link">
                        {p.title}
                    </Link>
                </h3>

                <div className="mt-auto flex flex-col justify-end">

                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-base md:text-lg font-bold text-neutral-900">{priceDisplay}</span>
                            {originalPriceDisplay && (
                                <span className="text-xs md:text-sm text-stone-400 line-through">
                                    {originalPriceDisplay}
                                </span>
                            )}
                        </div>
                        {!isCustomOrder && (
                            <Link 
                                href={`/reviews/${p.id || p.slug}`} 
                                className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all active:scale-90"
                            >
                            {ratingData.count === -1 ? (
                                /* Loading — show subtle placeholder, not "No reviews" */
                                <div className="flex items-center gap-1 text-xs text-gray-300 font-medium whitespace-nowrap">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ddd" stroke="#ddd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                </div>
                            ) : ratingData.count === 0 ? (
                                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium whitespace-nowrap">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#aaa" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            </Link>
                        )}
                    </div>

                    {(!inStock && !isCustomOrder) ? (
                        <div className="interactive-qty-pill w-full">
                            <button
                                type="button"
                                disabled={true}
                                className="add-to-cart-overlay cursor-not-allowed"
                                style={{ opacity: 0.5, backgroundColor: "#8B7355", color: "#F5EFE6" }}
                            >
                                Out of Stock
                            </button>
                        </div>
                    ) : isCustomOrder ? (
                        <div className="interactive-qty-pill w-full">
                            <button
                                type="button"
                                className="add-to-cart-overlay"
                                onClick={handleAction}
                            >
                                {getButtonLabel()}
                            </button>
                        </div>
                    ) : (
                        <div className={`interactive-qty-pill w-full ${qtyInCart > 0 ? 'has-qty' : ''}`}>
                            <button 
                                type="button"
                                className="add-to-cart-overlay"
                                onClick={handleAction}
                            >
                                {getButtonLabel()}
                            </button>
                            
                            <div className="qty-controls">
                                <button
                                    type="button"
                                    aria-label="Decrease quantity"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (qtyInCart > 1) {
                                            updateQuantity((p.id || p.slug), qtyInCart - 1);
                                        } else {
                                            removeFromCart((p.id || p.slug));
                                        }
                                    }}
                                >
                                    &minus;
                                </button>
                                <span key={qtyInCart} aria-live="polite">
                                    {qtyInCart}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Increase quantity"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateQuantity((p.id || p.slug), qtyInCart + 1);
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </article>
    );
}
