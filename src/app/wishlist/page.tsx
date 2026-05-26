// app/wishlist/page.tsx
"use client";

import { useWishlist } from "@/hooks/useWishlist";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCardV2";
import { supabase } from "@/lib/supabaseClient";

export default function WishlistPage() {
  const { wishlist: items, loading } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const itemsStr = items.sort().join(',');

  useEffect(() => {
    if (loading) return; // Wait for useWishlist to load

    if (!itemsStr) {
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }

    const ids = itemsStr.split(',');

    let isMounted = true;

    // Absolute safety net: never show skeleton for more than 3 seconds
    const safety = setTimeout(() => {
      if (isMounted) setIsLoadingProducts(false);
    }, 3000);

    supabase
      .from("products")
      .select("*")
      .or(`id.in.(${ids.join(',')}),slug.in.(${ids.join(',')})`)
      .then(({ data }: { data: any }) => {
        if (!isMounted) return;
        clearTimeout(safety);
        if (data) setProducts(data);
        setIsLoadingProducts(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Wishlist product fetch error:", err);
        clearTimeout(safety);
        setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(safety);
    };
  }, [loading, itemsStr]);

  if (loading || (items.length > 0 && isLoadingProducts)) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-8 text-center">Wishlist</h1>
        <div className="plp-grid-mobile">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm animate-pulse">
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

  // Resolve IDs to full product objects
  const wishlistProducts = items.map(id => products.find(p => p.id === id || p.slug === id)).filter(Boolean);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-8 text-center">Wishlist</h1>

      {wishlistProducts.length === 0 ? (
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
      ) : (
        <div className="plp-grid-mobile">
          {wishlistProducts.map((p: any) => (
            <ProductCard key={p.id || p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
