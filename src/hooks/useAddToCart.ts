"use client";

import { useState, useCallback, useRef } from "react";
import { handleAddToCart as addToCartLib } from "@/lib/bags";
import { showToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { pushToDataLayer } from "@/lib/analytics";

type AddToCartState = "idle" | "adding" | "added";

export function useAddToCart() {
  const [state, setState] = useState<AddToCartState>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const addToCart = useCallback(
    async (product: { slug: string; title: string; price: number; images?: string[]; variants?: any[] }, options?: { showToast?: boolean; redirect?: boolean }) => {
      // Prevent double taps
      if (state === "adding" || state === "added") return;

      setState("adding");

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add to cart (Async/Supabase support)
      try {
        await addToCartLib(product);
        
        // Track Add to Cart
        pushToDataLayer({
          event: "add_to_cart",
          product_name: product.title,
          price: product.price,
          currency: "INR",
        });

        // Show "Added" state only after success
        setState("added");

        if (options?.showToast !== false) {
          showToast("Added to cart", {
            label: "View cart",
            onClick: () => router.push("/cart"),
          });
        }
      } catch (err) {
        console.error("[Hook] Add to cart error:", err);
        showToast("Failed to add to cart");
        setState("idle");
        return;
      }

      // Reset to idle after 1.5s
      timeoutRef.current = setTimeout(() => {
        setState("idle");
      }, 1500);
    },
    [state, router]
  );

  return { addToCart, state };
}

