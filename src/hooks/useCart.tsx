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
    await addToCartLib(product, userRef.current);
    await loadCart();
  }, [loadCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    await removeFromCartLib(productId, userRef.current);
    await loadCart();
  }, [loadCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    await updateQty(productId, quantity, userRef.current);
    await loadCart();
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    await clearCartLib(userRef.current);
    await loadCart();
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
    loadCart();
  }, [user, loadCart]);

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
