"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ItemSnapshot, 
  loadWishlist as loadWishlistLib, 
  toggleWishlist as toggleWishlistLib,
  syncLocalWishlistToDB,
  snap
} from "@/lib/bags";
import { useAuth } from "./useAuth";

type WishlistContextType = {
  wishlistItems: ItemSnapshot[];
  wishlist: string[];
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
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlist(Array.isArray(local) ? local : []);
        return;
      }

      const { data, error } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", currentUser.id);

      if (error) throw error;
      setWishlist(data.map(item => item.product_id));
    } catch (err) {
      console.error("WISHLIST LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleWishlist = useCallback(async (product: any) => {
    const productId = product.id || product.slug;
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;

    // OPTIMISTIC UPDATE
    const wasWishlisted = wishlist.includes(productId);
    setWishlist(prev => wasWishlisted ? prev.filter(id => id !== productId) : [...prev, productId]);

    if (!currentUser) {
      // GUEST MODE
      let local = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (!Array.isArray(local)) local = [];

      if (local.includes(productId)) {
        local = local.filter((id: string) => id !== productId);
      } else {
        local.push(productId);
      }

      localStorage.setItem("wishlist", JSON.stringify(local));
      return;
    }

    // LOGGED IN FLOW
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("product_id", productId);
      } else {
        await supabase.from("wishlist").insert([
          {
            user_id: currentUser.id,
            product_id: productId,
            name: product.name || product.title,
            price: product.price,
            image: product.image || product.images?.[0]
          }
        ]);
      }
      await loadWishlist();
    } catch (err) {
      console.error("WISHLIST TOGGLE ERROR:", err);
      await loadWishlist(); // Revert on failure
    }
  }, [wishlist, loadWishlist]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const itemCount = useMemo(() => wishlist.length, [wishlist]);

  useEffect(() => {
    loadWishlist();

    const onBagChange = () => loadWishlist();
    window.addEventListener("bag:changed", onBagChange);
    window.addEventListener("storage", onBagChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Wishlist] Auth event:", event);
      if (event === "SIGNED_IN" && session?.user?.id) {
        // Sync guest -> DB
        const currentUser = session.user;
        const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
        
        if (Array.isArray(local) && local.length > 0) {
          for (const id of local) {
            await supabase.from("wishlist").upsert({
              user_id: currentUser.id,
              product_id: id
            });
          }
          localStorage.removeItem("wishlist");
        }
        await loadWishlist();
      } else if (event === "SIGNED_OUT") {
        setWishlist([]);
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
    wishlist,
    loading,
    loadWishlist,
    toggleWishlist,
    isWishlisted,
    itemCount,
    isToggling: false
  }), [wishlist, loading, loadWishlist, toggleWishlist, isWishlisted, itemCount]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return ctx;
}
