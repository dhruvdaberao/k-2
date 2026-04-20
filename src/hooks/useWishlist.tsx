"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ItemSnapshot, 
  loadWishlist as loadWishlistLib, 
  toggleWishlist as toggleWishlistLib,
  syncLocalWishlistToDB 
} from "@/lib/bags";
import { useAuth } from "./useAuth";

type WishlistContextType = {
  wishlistItems: ItemSnapshot[];
  loading: boolean;
  loadWishlist: () => Promise<void>;
  toggleWishlist: (product: any) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  itemCount: number;
  isToggling: boolean;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<ItemSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const loadWishlist = useCallback(async () => {
    try {
      const items = await loadWishlistLib(user);
      setWishlistItems(items);
    } catch (err) {
      console.error("WISHLIST HOOK ERROR (Load):", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleWishlist = useCallback(async (product: any) => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await toggleWishlistLib(product, user);
      await loadWishlist();
    } catch (err) {
      console.error("WISHLIST HOOK ERROR (Toggle):", err);
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, loadWishlist, user]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);

  const itemCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  useEffect(() => {
    loadWishlist();

    const onBagChange = () => {
      loadWishlist();
    };

    window.addEventListener("bag:changed", onBagChange);
    window.addEventListener("storage", onBagChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        await syncLocalWishlistToDB(session.user.id);
        await loadWishlist();
      } else if (event === "SIGNED_OUT") {
        setWishlistItems([]);
        await loadWishlist();
      }
    });

    return () => {
      window.removeEventListener("bag:changed", onBagChange);
      window.removeEventListener("storage", onBagChange);
      subscription.unsubscribe();
    };
  }, [loadWishlist]);

  const value = useMemo(() => ({
    wishlistItems,
    loading,
    loadWishlist,
    toggleWishlist,
    isWishlisted,
    itemCount,
    isToggling
  }), [wishlistItems, loading, loadWishlist, toggleWishlist, isWishlisted, itemCount, isToggling]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return ctx;
}
