// app/wishlist/page.tsx
"use client";

import { getWishlist, removeFromWishlist, addToCart } from "@/lib/bags";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCardV2";
import products from "@/data/products.json";


export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = () => setItems(getWishlist());

  useEffect(() => {
    setMounted(true);
    refresh();
    const h = () => refresh();
    window.addEventListener("bag:changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("bag:changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="container py-4">
        <h1>Wishlist</h1>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1>Wishlist</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="text-xl font-semibold text-[#2f2a26] mb-4">Nothing saved yet</h2>
          <Link href="/" className="btn-primary px-8 py-3">
            Browse products
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
