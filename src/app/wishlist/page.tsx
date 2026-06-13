// app/wishlist/page.tsx
"use client";

import { useWishlist, globalWishlistProductsCache, globalWishlistIdsCache } from "@/hooks/useWishlist";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCardV2";
import { supabase } from "@/lib/supabaseClient";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { showToast } from "@/components/Toast";
import EmptyStateRecommendations from "@/components/EmptyStateRecommendations";

export default function WishlistPage() {
  const { wishlist: items, loading, removeWishlistItems } = useWishlist();
  const itemsStr = [...items].sort().join(',');

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
    setIsLoadingProducts(true);
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
          // Only update local state here, let prefetcher handle the global cache
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
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes wishlistShimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .wishlist-skeleton-element {
            background: linear-gradient(90deg, #EAE1D3 25%, #f5efe6 37%, #EAE1D3 63%);
            background-size: 800px 100%;
            animation: wishlistShimmer 1.6s ease-in-out infinite;
          }
        `}} />
        <h1 className="collections-title mb-8 text-center">Wishlist</h1>
        <div className="plp-grid-mobile">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="overflow-hidden border border-[rgba(139,94,60,0.15)] shadow-sm" style={{ backgroundColor: '#F5EFE6', borderRadius: '24px' }}>
              <div className="w-full aspect-[3/4] wishlist-skeleton-element" />
              <div className="p-4 pb-5">
                <div className="h-4 w-[85%] rounded-full mb-3" style={{ background: 'linear-gradient(90deg, #dfd4c5 25%, #ebe3d6 37%, #dfd4c5 63%)', backgroundSize: '800px 100%', animation: 'wishlistShimmer 1.6s ease-in-out infinite' }}></div>
                <div className="h-5 w-[45%] rounded-full" style={{ background: 'linear-gradient(90deg, #dfd4c5 25%, #ebe3d6 37%, #dfd4c5 63%)', backgroundSize: '800px 100%', animation: 'wishlistShimmer 1.6s ease-in-out infinite' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="text-center mb-4">
        <h1 className="collections-title mb-3 md:mb-6 text-center">Wishlist</h1>
        {items.length > 0 && (
          <button 
            onClick={() => setShowClearAll(true)}
            className="btn-clear-pill inline-block"
            style={{ fontSize: '12px', padding: '6px 16px' }}
          >
            Clear All Items
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 pb-32 text-center mx-auto w-full">
          <div className="max-w-md w-full flex flex-col items-center">
            <div className="mb-6 flex justify-center">
              <img src="/nav-icons/empty-bag (3).png" alt="Empty Wishlist" style={{ width: '260px', height: '260px', objectFit: 'contain', padding: '10px' }} className="mx-auto" />
            </div>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-serif font-bold text-[#2f2a26] mb-2 md:mb-4">Your wishlist is empty</h2>
            <p className="text-stone-500 mb-8 text-sm md:text-lg lg:text-xl italic">
              Save your favorite handcrafted pieces here to keep track of what you love.
            </p>
            <Link 
              href="/collections" 
              className="btn btn-primary px-10 py-3 md:px-14 md:py-4 md:text-xl lg:text-2xl rounded-full font-bold shadow-sm"
              style={{ minWidth: '220px' }}
            >
              Browse Collections
            </Link>
          </div>

          <div className="mt-12 w-full max-w-5xl mx-auto border-t-2 border-[#E6DCCF] pt-12">
            <EmptyStateRecommendations title="You May Also Like" />
          </div>
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
              <div className="w-full aspect-square bg-[#EAE1D3]" />
              <div className="p-3">
                <div className="h-4 w-3/4 bg-[#EAE1D3] rounded mb-2"></div>
                <div className="h-5 w-1/3 bg-[#EAE1D3] rounded"></div>
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
