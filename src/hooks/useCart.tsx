"use client";

import { supabase } from "@/lib/supabaseClient";
import { getCart } from "@/lib/bags";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  CartItem,
  addToCart as addToCartLib,
  loadCart as loadCartLib,
  removeFromCart as removeFromCartLib,
  updateQty,
  syncLocalCartToDB,
  clearAllLocalData,
  clearCart as clearCartLib,
  snap,
} from "@/lib/bags";
import { useAuth } from "./useAuth";

type CartContextType = {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  loadCart: () => Promise<void>;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  
  const { user } = useAuth();
  // Hydrate instantly from localStorage cache — never show empty cart while loading
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getCart();
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return getCart().length === 0; // Only show loading if cache is empty
  });
  const isInitialLoad = useRef(true);
  const hadCacheAtInit = useRef(typeof window !== "undefined" && getCart().length > 0);
  const reqIdRef = useRef(0);
  const userRef = useRef(user);
  
  // Keep userRef in sync without triggering re-renders
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadCart = useCallback(async (currentUser?: any) => {
    const reqId = ++reqIdRef.current;
    try {
      if (isInitialLoad.current && !hadCacheAtInit.current) setLoading(true);
      const targetUser = currentUser !== undefined ? currentUser : userRef.current;
      const items = await loadCartLib(targetUser);
      
      // Prevent race conditions: only the latest request gets to update state
      if (reqId === reqIdRef.current) {
        setCartItems(items);
      }
    } catch (err) {
      console.error("[CartHook] loadCart error:", err);
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, []); // Stable reference — no dependencies

  const addToCart = useCallback(async (product: any) => {
    const item = snap(product);
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    try {
      await addToCartLib(product, userRef.current);
    } finally {
      await loadCart();
    }
  }, [loadCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    try {
      await removeFromCartLib(productId, userRef.current);
    } finally {
      await loadCart();
    }
  }, [loadCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    setCartItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
    try {
      await updateQty(productId, quantity, userRef.current);
    } finally {
      await loadCart();
    }
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    try {
      await clearCartLib(userRef.current);
    } finally {
      await loadCart();
    }
  }, [loadCart]);

  // Initial load + auth state listener (runs once)
  useEffect(() => {
    loadCart();

    const onBagChange = () => {
      loadCart();
    };

    window.addEventListener("bag:changed", onBagChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[CartHook] Auth event:", event);
      if (event === "SIGNED_IN" && session?.user?.id) {
        await syncLocalCartToDB(session.user.id);
        await loadCart();
      } else if (event === "SIGNED_OUT") {
        setCartItems([]);
      }
    });

    return () => {
      window.removeEventListener("bag:changed", onBagChange);
      subscription.unsubscribe();
    };
  }, [loadCart]); // loadCart is now stable (empty deps), so this runs once

  // Reload cart when user changes (login/logout)
  useEffect(() => {
    loadCart(user);
  }, [user, loadCart]);

  const value = useMemo(() => ({
    cartItems,
    setCartItems,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loading,
  }), [cartItems, addToCart, loadCart, removeFromCart, updateQuantity, clearCart, loading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
