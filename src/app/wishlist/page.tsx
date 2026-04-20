// app/wishlist/page.tsx
"use client";

import { useWishlist } from "@/hooks/useWishlist";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCardV2";
import products from "@/data/products.json";


export default function WishlistPage() {
  const { wishlistItems: items, loading } = useWishlist();

  if (loading) {
    return (
      <div className="container py-4 flex flex-col items-center justify-center min-h-[40vh]">
        <h1>Wishlist</h1>
        <p className="mt-3 text-stone-500 italic">Finding your saved pieces...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1>Wishlist</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-md mx-auto">
          <div className="mb-6 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2f2a26] mb-2">Your wishlist is empty</h2>
          <p className="text-stone-500 mb-8 text-sm italic">
            Save your favorite handcrafted pieces here to keep track of what you love.
          </p>
          <Link href="/collections" className="btn-primary px-8 py-3 rounded-pill fw-bold">
            Browse Collections
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid mt-4">
          {items.map((it) => {
            // ROBUST LINK FIX: Find matching product by multiple strategies
            const pSlug = (it as any).productSlug;
            const itemId = it.id || "";
            const foundSlug = (() => {
              if (pSlug) return pSlug;
              // 1. Prefix match (handles "slug-variant")
              const prefix = (products as any[]).find(p => itemId.startsWith(p.slug));
              if (prefix) return prefix.slug;
              // 2. Title match (handles "Title Saved As Slug")
              const titleMatch = (products as any[]).find(p => p.title === it.name || p.title === itemId);
              if (titleMatch) return titleMatch.slug;
              // 3. Fallback normalization ("Crochet Toran" -> "crochet-toran")
              return itemId.toLowerCase().replace(/\s+/g, '-');
            })();

            return (
              <div key={it.id} className="wishlist-grid__item">
                <ProductCard
                  p={{
                    ...it,
                    slug: foundSlug, // Override with correct slug
                    description: "",
                    images: [it.image],
                    variants: []
                  } as any}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
