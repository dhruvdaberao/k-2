// src/lib/actions.ts
import type { Product } from "@/types";

/** ---- tiny localStorage helpers + event emitter ---- */
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
function emit(name: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

/** ---- CART ---- */
export type CartItem = { slug: string; qty: number };

export function addToCart(product: Product, qty = 1) {
  const cart = read<CartItem[]>("cart", []);
  const i = cart.findIndex((c) => c.slug === product.slug);
  if (i >= 0) cart[i].qty += qty;
  else cart.push({ slug: product.slug, qty });
  write("cart", cart);
  emit("cart:update");
}

export function removeFromCart(slug: string) {
  const cart = read<CartItem[]>("cart", []);
  write("cart", cart.filter((c) => c.slug !== slug));
  emit("cart:update");
}

/** ---- WISHLIST ---- */
export function toggleWishlist(product: Product) {
  const wl = new Set(read<string[]>("wishlist", []));
  wl.has(product.slug) ? wl.delete(product.slug) : wl.add(product.slug);
  write("wishlist", Array.from(wl));
  emit("wishlist:update");
}
export function isWishlisted(slug: string) {
  return read<string[]>("wishlist", []).includes(slug);
}

/** ---- COLLECTIONS ----
 * structure in LS: { [name: string]: string[] }  (name -> slugs[])
 */
export function addToCollection(product: Product, name = "keyring") {
  const collections = read<Record<string, string[]>>("collections", {});
  const list = new Set(collections[name] ?? []);
  list.add(product.slug);
  collections[name] = Array.from(list);
  write("collections", collections);
  emit("collections:update");
}
export function getCollections() {
  return read<Record<string, string[]>>("collections", {});
}
