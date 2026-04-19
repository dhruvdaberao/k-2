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
} from "@/lib/bags";

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadCart = useCallback(async () => {
    const items = await loadCartLib();
    setCartItems(items);
  }, []);

  const addToCart = useCallback(async (product: any) => {
    await addToCartLib(product);
    await loadCart();
  }, [loadCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    await removeFromCartLib(productId);
    await loadCart();
  }, [loadCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    await updateQty(productId, quantity);
    await loadCart();
  }, [loadCart]);

  useEffect(() => {
    loadCart();

    const onBagChange = () => {
      loadCart();
    };

    window.addEventListener("bag:changed", onBagChange);

    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await syncLocalCartToDB(user.id);
        }
        await loadCart();
      }

      if (event === "SIGNED_OUT") {
        await loadCart();
      }
    });

    return () => {
      window.removeEventListener("bag:changed", onBagChange);
      listener.subscription.unsubscribe();
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
