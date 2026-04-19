// lib/bags.ts
"use client";

import { supabase } from "./supabaseClient";
import productsData from "@/data/products.json";
import { fetchDBCart, updateDBCartItem, removeDBCartItem, clearDBCart } from "./cartSupabase";

export type ItemSnapshot = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export type CartItem = ItemSnapshot & {
  quantity: number;
};

type Collections = Record<string, ItemSnapshot[]>;

const CART_KEY = "cart";
const WISHLIST_KEY = "wishlist:v1";
const WISHLIST_ITEMS_KEY = "wishlist:items:v1";
const COLLECTIONS_KEY = "collections:v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`[Cart] LocalStorage updated:`, value);
  } catch (e) {
    console.warn("Storage write failed", e);
  }
}

function snap(p: any): ItemSnapshot {
  return {
    id: p.id || p.slug,
    name: p.title || p.name,
    price: Number(p.price),
    image: p.image || p.img || p.image_url || p.images?.[0] || "/placeholder.png",
  };
}

// Let UI know something changed
function notify() {
  window.dispatchEvent(new CustomEvent("bag:changed"));
}

/* ---------------- CART ---------------- */
export async function loadCart(): Promise<CartItem[]> {
  console.log("[Cart] loadCart called");
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log("[Cart] User logged in:", user.id);
    
    // Check if we have un-synced local items
    const local = read<CartItem[]>(CART_KEY, []);
    if (local.length > 0) {
      console.log("[Cart] Found local items, triggering merge sync...");
      await syncLocalCartToDB(user.id);
    }

    const dbItems = await fetchDBCart(user.id);
    const data: CartItem[] = dbItems.map(dbItem => {
      const match = (productsData as any[]).find(p => p.slug === dbItem.product_id);
      return {
        id: dbItem.product_id,
        name: match?.title || "Unknown Item",
        price: match?.price || 0,
        image: match?.images?.[0] || "/placeholder.png",
        quantity: dbItem.quantity
      };
    });

    console.log("[Cart] Hydrating local cache from synced DB truth");
    write(CART_KEY, data);
    return data;
  } else {
    console.log("[Cart] Guest mode, fetching from localStorage");
    return read<CartItem[]>(CART_KEY, []);
  }
}

/** Synchronous cart read for guest/performance fallback */
export function getCart(): CartItem[] {
  return read<CartItem[]>(CART_KEY, []);
}

export async function asyncCartCount(): Promise<number> {
  const list = await loadCart();
  return list.reduce((n, it) => n + it.quantity, 0);
}

export async function handleAddToCart(product: any) {
  const p = snap(product);
  console.log("[Cart] handleAddToCart requested for:", p);

  // 1. Update localStorage instantly for immediate UI feedback
  let cart = read<CartItem[]>(CART_KEY, []);
  const existingLocally = cart.find(i => i.id === p.id);
  let newQuantity = 1;

  if (existingLocally) {
    existingLocally.quantity += 1;
    newQuantity = existingLocally.quantity;
    console.log(`[Cart] Incremented local quantity for ${p.id}: ${newQuantity}`);
  } else {
    cart.push({ ...p, quantity: 1 });
    console.log(`[Cart] Added new item to local cart: ${p.id}`);
  }

  write(CART_KEY, cart);
  notify(); // Triggers Badge and Product Card updates instantly

  // 2. Perform background sync to Supabase if logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log("[Cart] Logged in user detected, syncing to DB...");
    // We don't necessarily need to await this if we want "fire and forget" for speed,
    // but awaiting is safer for errors. Note: UI is already updated.
    try {
      await updateDBCartItem(user.id, p.id, newQuantity);
      console.log("[Cart] DB Sync complete");
    } catch (err) {
      console.error("[Cart] DB Sync failed:", err);
    }
  }
}

export const addToCart = handleAddToCart;

export async function updateQty(productId: string, quantity: number) {
  console.log(`[Cart] updateQty: ${productId} -> ${quantity}`);
  
  // 1. Update localStorage instantly
  let cart = read<CartItem[]>(CART_KEY, []);
  if (quantity <= 0) {
    cart = cart.filter(x => x.id !== productId);
    console.log(`[Cart] Removed ${productId} from local storage`);
  } else {
    const it = cart.find(x => x.id === productId);
    if (it) it.quantity = quantity;
    console.log(`[Cart] Updated ${productId} quantity to ${quantity} in local storage`);
  }
  write(CART_KEY, cart);
  notify();

  // 2. Background DB Sync
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await updateDBCartItem(user.id, productId, quantity);
    } catch (err) {
      console.error("[Cart] DB Update failed:", err);
    }
  }
}

export async function removeFromCart(productId: string) {
  console.log(`[Cart] removeFromCart: ${productId}`);
  
  // 1. Update localStorage instantly
  let cart = read<CartItem[]>(CART_KEY, []);
  cart = cart.filter(x => x.id !== productId);
  console.log(`[Cart] Deleted item ${productId} from local storage`);
  write(CART_KEY, cart);
  notify();

  // 2. Background DB Sync
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await removeDBCartItem(user.id, productId);
    } catch (err) {
      console.error("[Cart] DB Delete failed:", err);
    }
  }
}

export async function clearCart() {
  console.log("[Cart] clearCart requested");
  
  // 1. Clear local instantly
  write(CART_KEY, []);
  notify();

  // 2. Background DB Sync
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await clearDBCart(user.id);
    } catch (err) {
      console.error("[Cart] DB Clear failed:", err);
    }
  }
}

/* -------------- WISHLIST -------------- */
export function toggleWishlist(p: any): boolean {
  const s = snap(p);
  const set = new Set<string>(read<string[]>(WISHLIST_KEY, []));
  const items = read<Record<string, ItemSnapshot>>(WISHLIST_ITEMS_KEY, {});

  let nowIn = false;
  if (set.has(s.id)) {
    set.delete(s.id);
    delete items[s.id];
  } else {
    set.add(s.id);
    items[s.id] = s;
    nowIn = true;
  }
  write(WISHLIST_KEY, [...set]);
  write(WISHLIST_ITEMS_KEY, items);
  notify();
  return nowIn;
}

export function getWishlist(): ItemSnapshot[] {
  const ids = read<string[]>(WISHLIST_KEY, []);
  const items = read<Record<string, ItemSnapshot>>(WISHLIST_ITEMS_KEY, {});
  return ids.map((id) => items[id]).filter(Boolean);
}

export function wishlistCount(): number {
  return read<string[]>(WISHLIST_KEY, []).length;
}

export function removeFromWishlist(id: string) {
  const set = new Set<string>(read<string[]>(WISHLIST_KEY, []));
  const items = read<Record<string, ItemSnapshot>>(WISHLIST_ITEMS_KEY, {});
  set.delete(id);
  delete items[id];
  write(WISHLIST_KEY, [...set]);
  write(WISHLIST_ITEMS_KEY, items);
  notify();
}

/* ------------- COLLECTIONS ------------ */
export function getCollections(): Collections {
  return read<Collections>(COLLECTIONS_KEY, {});
}

export function addToCollection(p: any, name?: string) {
  const colls = getCollections();
  const s = snap(p);
  const target = (name || prompt('Add to which collection?', 'keyring') || '').trim();
  if (!target) return;

  const list = colls[target] || [];
  if (!list.some((x) => x.id === s.id)) list.push(s);

  colls[target] = list;
  write(COLLECTIONS_KEY, colls);
  notify();
}

export function removeFromCollection(name: string, id: string) {
  const colls = getCollections();
  if (!colls[name]) return;
  colls[name] = colls[name].filter((x) => x.id !== id);
  if (colls[name].length === 0) delete colls[name];
  write(COLLECTIONS_KEY, colls);
  notify();
}
