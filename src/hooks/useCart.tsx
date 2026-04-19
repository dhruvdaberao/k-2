"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  CartItem,
  addToCart as addToCartLib,
  loadCart as loadCartLib,
  removeFromCart as removeFromCartLib,
  updateQty,
  syncLocalCartToDB,
  clearAllLocalData,
} from "@/lib/bags";
import { useAuth } from "./useAuth";

type CartContextType = {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  loadCart: () => Promise<void>;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadCart = useCallback(async () => {
    const items = await loadCartLib(user);
    setCartItems(items);
  }, [user]);

  const addToCart = useCallback(async (product: any) => {
    await addToCartLib(product, user);
    await loadCart();
  }, [loadCart, user]);

  const removeFromCart = useCallback(async (productId: string) => {
    await removeFromCartLib(productId, user);
    await loadCart();
  }, [loadCart, user]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    await updateQty(productId, quantity, user);
    await loadCart();
  }, [loadCart, user]);

  useEffect(() => {
    loadCart();

    const onBagChange = () => {
      loadCart();
    };

    window.addEventListener("bag:changed", onBagChange);

    // Phase 11 & 6: Auto load and sync after login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[CartHook] Auth event:", event);
      if (event === "SIGNED_IN" && session?.user?.id) {
        // Step 6: Sync guest -> DB
        await syncLocalCartToDB(session.user.id);
        await loadCart();
      } else if (event === "SIGNED_OUT") {
        setCartItems([]);
        // Local content is cleared by AuthProvider, so loadCart will return []
        await loadCart();
      }
    });

    return () => {
      window.removeEventListener("bag:changed", onBagChange);
      subscription.unsubscribe();
    };
  }, [loadCart]);

  const value = useMemo(() => ({
    cartItems,
    setCartItems,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
  }), [cartItems, addToCart, loadCart, removeFromCart, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
