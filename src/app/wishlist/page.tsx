// app/wishlist/page.tsx
"use client";

import { useWishlist } from "@/hooks/useWishlist";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCardV2";
import { supabase } from "@/lib/supabaseClient";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { showToast } from "@/components/Toast";

let globalWishlistProductsCache: any[] = [];
let globalWishlistIdsCache: string = "";

export default function WishlistPage() {
  const { wishlist: items, loading, removeWishlistItems } = useWishlist();
  const itemsStr = items.sort().join(',');

  const [products, setProducts] = useState<any[]>(() => {
    return itemsStr === globalWishlistIdsCache ? globalWishlistProductsCache : [];
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(() => {
    return itemsStr !== globalWishlistIdsCache && itemsStr !== "";
  });
  const [showRetryDelay, setShowRetryDelay] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  const fetchControllerRef = useRef(0);

  const fetchProducts = useCallback((ids: string[]) => {
    const reqId = ++fetchControllerRef.current;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const uuids = ids.filter(id => uuidRegex.test(id));
      const slugs = ids.filter(id => !uuidRegex.test(id));

      let orFilters = [];
      if (uuids.length > 0) orFilters.push(`id.in.(${uuids.join(',')})`);
      if (slugs.length > 0) orFilters.push(`slug.in.(${slugs.join(',')})`);

      if (orFilters.length === 0) return;

      supabase
        .from("products")
        .select("*")
        .or(orFilters.join(','))
      .then(({ data }: { data: any }) => {
        if (reqId !== fetchControllerRef.current) return;
        if (data) {
          setProducts(data);
          globalWishlistProductsCache = data;
          globalWishlistIdsCache = ids.join(',');
          // Check for ghost items (IDs in wishlist that don't match any fetched product)
          const validIds = new Set(data.map((p: any) => p.id).concat(data.map((p: any) => p.slug)));
          const ghostIds = ids.filter(id => !validIds.has(id));
          if (ghostIds.length > 0 && removeWishlistItems) {
            console.log("Removing ghost wishlist items:", ghostIds);
            removeWishlistItems(ghostIds);
          }
        }
        setIsLoadingProducts(false);
      })
      .catch((err: any) => {
        console.error("Wishlist product fetch error:", err);
        setIsLoadingProducts(false);
      });
  }, [removeWishlistItems]);

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

  // Resolve IDs to full product objects
  const wishlistProducts = items.map(id => products.find(p => p.id === id || p.slug === id)).filter(Boolean);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoadingProducts && items.length > 0 && wishlistProducts.length === 0) {
      timer = setTimeout(() => setShowRetryDelay(true), 2000);
    } else {
      setShowRetryDelay(false);
    }
    return () => clearTimeout(timer);
  }, [isLoadingProducts, items.length, wishlistProducts.length]);

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


  // Show skeleton only while the useWishlist hook itself is loading (first paint)
  // OR while we have items but products haven't loaded yet for the first time
  const showSkeleton = loading || (items.length > 0 && isLoadingProducts && products.length === 0);

  useEffect(() => {
    if (showSkeleton) {
      const timer = setTimeout(() => setSkeletonTimeout(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setSkeletonTimeout(false);
    }
  }, [showSkeleton]);

  if (showSkeleton) {
    if (skeletonTimeout) {
      return (
        <div className="container py-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
          <p className="text-stone-500 mb-4">Taking too long to load?</p>
          <button onClick={() => window.location.reload()} className="btn-primary px-8 py-2 rounded-full font-bold">Reload Page</button>
        </div>
      );
    }
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-8 text-center">Wishlist</h1>
        <div className="plp-grid-mobile">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="overflow-hidden border border-stone-100 shadow-sm animate-pulse" style={{ backgroundColor: '#F5EFE6', borderRadius: '24px' }}>
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-[#2f2a26]">Wishlist</h1>
        {items.length > 0 && (
          <button 
            onClick={() => setShowClearAll(true)}
            className="btn-clear-pill mt-3 inline-block"
            style={{ fontSize: '12px', padding: '6px 16px' }}
          >
            Clear All Items
          </button>
        )}
      </div>

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
      ) : showRetryDelay ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-4 max-w-md mx-auto">
          <p className="text-stone-500 mb-4 text-sm">We couldn't load your wishlist products right now.</p>
          <button onClick={() => {
            setIsLoadingProducts(true);
            setShowRetryDelay(false);
            fetchProducts(itemsStr.split(','));
          }} className="btn-primary px-8 py-2 rounded-full font-bold text-sm">
            Retry
          </button>
        </div>
      ) : (
        /* Show skeleton cards while waiting for retry delay */
        <div className="plp-grid-mobile">
          {items.map((id, i) => (
            <div key={id} className="overflow-hidden border border-stone-100 shadow-sm animate-pulse" style={{ backgroundColor: '#F5EFE6', borderRadius: '24px' }}>
              <div className="w-full aspect-square bg-stone-200" />
              <div className="p-3">
                <div className="h-4 w-3/4 bg-stone-200 rounded mb-2"></div>
                <div className="h-5 w-1/3 bg-stone-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Clear All Confirmation ── */}
      <ConfirmModal
        isOpen={showClearAll}
        title="Clear wishlist?"
        message="This will remove all items from your wishlist. This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (items.length > 0) {
            removeWishlistItems(items);
            showToast("Wishlist cleared successfully.");
          }
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
      />
    </div>
  );
}
