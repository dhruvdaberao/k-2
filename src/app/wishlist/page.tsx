// app/wishlist/page.tsx
"use client";

import { useWishlist } from "@/hooks/useWishlist";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCardV2";
import { supabase } from "@/lib/supabaseClient";

export default function WishlistPage() {
  const { wishlist: items, loading } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const fetchControllerRef = useRef(0);

  const itemsStr = items.sort().join(',');

  const fetchProducts = useCallback((ids: string[]) => {
    const reqId = ++fetchControllerRef.current;
    supabase
      .from("products")
      .select("*")
      .or(`id.in.(${ids.join(',')}),slug.in.(${ids.join(',')})`)
      .then(({ data }: { data: any }) => {
        if (reqId !== fetchControllerRef.current) return;
        if (data) setProducts(data);
        setIsLoadingProducts(false);
      })
      .catch((err: any) => {
        console.error("Wishlist product fetch error:", err);
        setIsLoadingProducts(false);
      });
  }, []);

  // Fetch products when wishlist IDs change
  useEffect(() => {
    if (loading) return;

    if (!itemsStr) {
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }

    fetchProducts(itemsStr.split(','));
  }, [loading, itemsStr, fetchProducts]);

  // Auto-retry fetch when user returns to the tab (PWA background resume fix)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && itemsStr) {
        fetchProducts(itemsStr.split(','));
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [itemsStr, fetchProducts]);

  // Resolve IDs to full product objects
  const wishlistProducts = items.map(id => products.find(p => p.id === id || p.slug === id)).filter(Boolean);

  // Show skeleton only while the useWishlist hook itself is loading (first paint)
  // OR while we have items but products haven't loaded yet for the first time
  const showSkeleton = loading || (items.length > 0 && isLoadingProducts && products.length === 0);

  if (showSkeleton) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-8 text-center">Wishlist</h1>
        <div className="plp-grid-mobile">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#F5EFE6]-[24px] overflow-hidden border border-stone-100 shadow-sm animate-pulse">
              <div className="w-full aspect-square bg-stone-200" />
              <div className="p-3">
                <div className="h-4 w-3/4 bg-stone-200 rounded mb-2"></div>
                <div className="h-5 w-1/3 bg-stone-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-8 text-center">Wishlist</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-md mx-auto">
          <div className="mb-6 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2f2a26] mb-2">Your wishlist is empty</h2>
          <p className="text-stone-500 mb-8 text-sm italic">
            Save your favorite handcrafted pieces here to keep track of what you love.
          </p>
          <Link href="/collections" className="btn-primary px-10 py-3 rounded-full font-bold">
            Browse Collections
          </Link>
        </div>
      ) : wishlistProducts.length > 0 ? (
        <div className="plp-grid-mobile">
          {wishlistProducts.map((p: any) => (
            <ProductCard key={p.id || p.slug} p={p} />
          ))}
        </div>
      ) : (
        /* Items exist in wishlist but products haven't loaded from server yet — show skeleton cards */
        <div className="plp-grid-mobile">
          {items.map((id, i) => (
            <div key={id} className="bg-[#F5EFE6]-[24px] overflow-hidden border border-stone-100 shadow-sm animate-pulse">
              <div className="w-full aspect-square bg-stone-200" />
              <div className="p-3">
                <div className="h-4 w-3/4 bg-stone-200 rounded mb-2"></div>
                <div className="h-5 w-1/3 bg-stone-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
