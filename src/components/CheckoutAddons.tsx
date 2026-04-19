"use client";

import { useState } from "react";
import products from "@/data/products.json";
import { addToCart } from "@/lib/bags";
import type { Product } from "@/types";

interface CheckoutAddonsProps {
    currentCartSlugs: string[];
    onAdded?: () => void;
}

export default function CheckoutAddons({ currentCartSlugs, onAdded }: CheckoutAddonsProps) {
    const [addedSlugs, setAddedSlugs] = useState<Set<string>>(new Set());

    // Filter add-on products
    const addonProducts = (products as Product[])
        .filter(p => {
            // Must be direct purchase
            if (p.type !== "direct-purchase" && p.type !== undefined && p.type !== "custom-order") return false;
            if (p.type === "custom-order") return false;

            // Must be under ₹500
            if (p.price >= 500) return false;

            // Must be in stock
            if (typeof p.stock === "number" && p.stock <= 0) return false;

            // Must not be in cart
            if (currentCartSlugs.includes(p.id || p.slug)) return false;

            // Prefer certain categories
            const cat = (p.category || "").toLowerCase();
            const preferredCats = ["accessories", "keyrings", "coasters"];

            return preferredCats.some(c => cat.includes(c));
        })
        .slice(0, 4); // Max 4 products

    if (addonProducts.length === 0) return null;

    const handleAdd = async (product: Product) => {
        await addToCart(product);
        onAdded?.();
        setAddedSlugs(prev => new Set(prev).add(product.id || product.slug));

        // Reset after 2 seconds
        setTimeout(() => {
            setAddedSlugs(prev => {
                const next = new Set(prev);
                next.delete(product.id || product.slug);
                return next;
            });
        }, 2000);
    };

    return (
        <div className="add-ons bg-white p-4 rounded-2xl border border-stone-200 shadow-sm mb-8">
            <h3 className="text-base font-bold text-[#2f2a26] mb-0.5">
                Add a little something?
            </h3>
            <p className="text-xs text-stone-500 mb-4">
                Handmade artisanal add-ons to complete your collection.
            </p>

            {/* Product List */}
            <div className="flex flex-col gap-3">
                {addonProducts.map(product => {
                    const isAdded = addedSlugs.has(product.id || product.slug);
                    const imgSrc = (product as any).image || (product as any).img || (product as any).image_url || product.images?.[0] || "/placeholder.png";

                    return (
                        <div
                            key={product.id || product.slug}
                            className="addon-item group bg-white rounded-xl p-3 border border-stone-100 flex items-center gap-3 transition-all hover:shadow-md hover:border-stone-200"
                        >
                            {/* Image */}
                            <img
                                src={imgSrc}
                                alt={product.title}
                                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0, background: "#f5f0eb" }}
                            />

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-[#2f2a26] mb-0.5 line-clamp-1">
                                    {product.title}
                                </h4>
                                <p className="text-sm font-bold text-[#8B5E3C]">
                                    ₹{product.price}
                                </p>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={() => handleAdd(product)}
                                disabled={isAdded}
                                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex-shrink-0 ${isAdded
                                        ? "bg-green-50 text-green-700 cursor-default border border-green-100"
                                        : "bg-white text-[#8B5E3C] border border-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white"
                                    }`}
                            >
                                {isAdded ? "Added ✓" : "+ Add"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
