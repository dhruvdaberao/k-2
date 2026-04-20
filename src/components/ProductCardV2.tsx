"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import Link from "next/link";
import { useState, MouseEvent } from "react";
import type { Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import HeartIcon from "@/components/HeartIcon";
import "./ProductCardV2.css";


export default function ProductCardV2({ p }: { p: Product }) {
    const { user } = useAuth();
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const router = useRouter();

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


    const handleAction = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (isCustomOrder) {
            // Enquire action
            const message = encodeURIComponent(`Hi! I'm interested in ${p.title}`);
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const defaultUrl = isMobile
                ? "https://ig.me/m/keshvi_crafts"
                : "https://www.instagram.com/direct/new/?username=keshvi_crafts";

            const url = p.cta?.url || defaultUrl;
            window.open(url, "_blank", "noopener,noreferrer");
            trackEvent({
                action: "click_instagram_enquiry",
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
        if (isCustomOrder) return "Enquire on Instagram";
        return "Add to Cart";
    };

    const visibleBadges = badges.slice(0, 2);
    const overflowCount = badges.length - 2;

    return (
        <article className="relative plp-card-mobile plp-card h-full flex flex-col group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300">

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
                            loading="lazy"
                        />
                    </div>
                </Link>

                {/* Wishlist Button */}
                <div className="absolute top-3 right-3 cursor-pointer z-10">
                    <HeartIcon 
                        filled={isHearted} 
                        onClick={() => toggleWishlist(p)} 
                    />
                </div>


            </div>

            {/* CONTENT */}
            <div className="flex flex-col flex-grow p-3 md:p-4">
                <h3 className="text-sm md:text-base font-medium text-neutral-900 leading-snug mb-1 line-clamp-1">
                    <Link href={`/products/${encoded}`} onClick={handleCardClick} className="product-title-link">
                        {p.title}
                    </Link>
                </h3>

                <div className="mt-auto flex flex-col justify-end">

                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-base md:text-lg flex-grow font-bold text-neutral-900">{priceDisplay}</span>
                    </div>

                    {isCustomOrder ? (
                        <button
                            type="button"
                            onClick={handleAction}
                            className="w-full btn-primary btn-sm-mobile"
                        >
                            {getButtonLabel()}
                        </button>
                    ) : qtyInCart > 0 ? (
                        <div className="qty-pill-brand w-full">
                            <button
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
                            <span aria-live="polite">
                                {qtyInCart}
                            </span>
                            <button
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
                    ) : (
                        <button
                            type="button"
                            onClick={handleAction}
                            disabled={!inStock}
                            className="w-full btn-primary btn-sm-mobile"
                        >
                            {getButtonLabel()}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
