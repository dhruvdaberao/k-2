// lib/directCheckout.ts
// Manages the "Buy Now" direct checkout flow via sessionStorage.
// This avoids modifying the cart and allows a single-item express checkout.

export type DirectCheckoutItem = {
  product_id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const STORAGE_KEY = "directCheckoutItem";

export function setDirectCheckoutItem(item: DirectCheckoutItem): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(item));
  } catch {
    console.error("[DirectCheckout] Failed to save item");
  }
}

export function getDirectCheckoutItem(): DirectCheckoutItem | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDirectCheckoutItem(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
