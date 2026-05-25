"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  ItemSnapshot, 
  loadWishlist as loadWishlistLib, 
  toggleWishlist as toggleWishlistLib,
  syncLocalWishlistToDB,
  getWishlist 
} from "@/lib/bags";
import { useAuth } from "./useAuth";

type WishlistContextType = {
  wishlist: string[];
  loading: boolean;
  loadWishlist: () => Promise<void>;
  toggleWishlist: (product: any) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  itemCount: number;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Start with empty state to match server render (avoids hydration mismatch)
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);
  const hadCacheAtInit = useRef(false);

  const filterValidIds = useCallback((ids: string[]) => {
    const validIds = ids.filter(id => id && id !== "undefined");
    return Array.from(new Set(validIds));
  }, []);

  // Hydrate from localStorage cache BEFORE browser paint (useLayoutEffect)
  // This ensures the user never sees empty wishlist — cached data appears on first frame
  useLayoutEffect(() => {
    const cached = getWishlist();
    if (cached.length > 0) {
      const ids = cached.map(i => String(i.id)).filter(id => id && id !== "undefined");
      const valid = Array.from(new Set(ids));
      if (valid.length > 0) {
        setWishlist(valid);
        setLoading(false);
        hadCacheAtInit.current = true;
      }
    }
  }, []); // Runs once on mount, before paint

  const loadWishlist = useCallback(async () => {
    try {
      if (isInitialLoad.current && !hadCacheAtInit.current) {
        setLoading(true);
      }
      const items = await loadWishlistLib(user);
      setWishlist(filterValidIds(items.map(i => String(i.id))));
    } catch (err) {
      console.error("WISHLIST LOAD ERROR:", err);
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [user]);

  const toggleWishlist = useCallback(async (product: any) => {
    const productId = String(product.id || product.slug || "");
    
    // Optimistic Update
    const wasWishlisted = wishlist.includes(productId);
    setWishlist(prev => {
      const next = wasWishlisted 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId];
      return filterValidIds(next);
    });

    try {
      await toggleWishlistLib(product, user);
      // lib/bags.ts calls loadWishlist(user) and notify() internally, 
      // but we should sync our local state just in case.
      const updated = await loadWishlistLib(user);
      setWishlist(filterValidIds(updated.map(i => String(i.id))));
    } catch (err) {
      console.error("WISHLIST TOGGLE ERROR:", err);
      await loadWishlist(); // Revert on failure
    }
  }, [wishlist, user, loadWishlist]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlist.includes(String(productId));
  }, [wishlist]);

  const itemCount = useMemo(() => wishlist.length, [wishlist]);

  // Initial load
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Listen for cross-tab or external changes
  useEffect(() => {
    const handleSync = () => {
      const items = getWishlist();
      setWishlist(filterValidIds(items.map(i => String(i.id))));
    };
    window.addEventListener("bag:changed", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("bag:changed", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Sync on Auth Change
  useEffect(() => {
    if (user?.id) {
      syncLocalWishlistToDB(user.id).then(() => loadWishlist());
    }
  }, [user?.id]);

  const value = useMemo(() => ({
    wishlist,
    loading,
    loadWishlist,
    toggleWishlist,
    isWishlisted,
    itemCount
  }), [wishlist, loading, loadWishlist, toggleWishlist, isWishlisted, itemCount]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
