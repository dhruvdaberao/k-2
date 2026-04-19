import { Product } from "@/types";

interface CartItem {
    slug: string;
    qty?: number; // Optional because sometime we might just pass products
    shippingCharge?: number;
    // allow other props
    [key: string]: any;
}

export const BASE_SHIPPING_FEE = 40;
export const FREE_SHIPPING_THRESHOLD = 650;

/**
 * Calculates shipping based on the updated rule:
 * - Free shipping (0) if subtotal >= 650
 * - Otherwise constant BASE_SHIPPING_FEE (60)
 * @param cartItems List of items in cart (kept for compat, unused now)
 * @param subtotal Current cart subtotal
 */
export function calculateShipping(cartItems: CartItem[], subtotal: number): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        return 0;
    }

    return BASE_SHIPPING_FEE;
}
