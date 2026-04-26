"use client";

import { supabase } from "@/lib/supabaseClient";

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
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const loadingRef = useRef(false);
  const userRef = useRef(user);
  const hasMergedRef = useRef(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  
  // Keep userRef in sync without triggering re-renders
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadCart = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const items = await loadCartLib(userRef.current);
      setCartItems(items);
    } catch (err) {
      console.error("[CartHook] loadCart error:", err);
    } finally {
      loadingRef.current = false;
    }
  }, []); // Stable reference — no dependencies

  const addToCart = useCallback(async (product: any) => {
    const productId = String(product?.id || product?.slug || "");
    const name = String(product?.name || product?.title || "Product");
    const price = Number(product?.price || 0);
    const image = String(product?.image || product?.img || product?.image_url || product?.images?.[0] || "/placeholder.png");

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { id: productId, name, price, image, quantity: 1 }];
    });

    try {
      await addToCartLib(product, userRef.current);
    } catch (err) {
      console.error("[CartHook] addToCart error:", err);
      await loadCart();
    }
  }, [loadCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    const prev = cartItems;
    setCartItems((current) => current.filter((item) => item.id !== productId));
    try {
      await removeFromCartLib(productId, userRef.current);
    } catch (err) {
      console.error("[CartHook] removeFromCart error:", err);
      setCartItems(prev);
      await loadCart();
    }
  }, [cartItems, loadCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const prev = cartItems;
    setCartItems((current) => {
      if (quantity <= 0) return current.filter((item) => item.id !== productId);
      return current.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
    try {
      await updateQty(productId, quantity, userRef.current);
    } catch (err) {
      console.error("[CartHook] updateQuantity error:", err);
      setCartItems(prev);
      await loadCart();
    }
  }, [cartItems, loadCart]);

  const clearCart = useCallback(async () => {
    const prev = cartItems;
    setCartItems([]);
    try {
      await clearCartLib(userRef.current);
    } catch (err) {
      console.error("[CartHook] clearCart error:", err);
      setCartItems(prev);
      await loadCart();
    }
  }, [cartItems, loadCart]);

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
        if (!hasMergedRef.current) {
          hasMergedRef.current = true;
          await syncLocalCartToDB(session.user.id);
        }
        await loadCart();
      } else if (event === "SIGNED_OUT") {
        hasMergedRef.current = false;
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
    if (!user?.id) {
      hasMergedRef.current = false;
    }
    if (lastLoadedUserIdRef.current === (user?.id ?? null)) {
      return;
    }
    lastLoadedUserIdRef.current = user?.id ?? null;
    loadCart();
  }, [user?.id, loadCart]);

  const value = useMemo(() => ({
    cartItems,
    setCartItems,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }), [cartItems, addToCart, loadCart, removeFromCart, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
