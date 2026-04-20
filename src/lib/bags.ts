"use client";

import { supabase } from "./supabaseClient";

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
const WISHLIST_KEY = "wishlist";
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
  } catch (e) {
    console.warn("Storage write failed", e);
  }
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bag:changed"));
}

function toStableId(product: any): string {
  return String(product?.id || product?.slug || "");
}

function snap(product: any): ItemSnapshot {
  const id = toStableId(product);
  return {
    id,
    name: String(product?.name || product?.title || "Product"),
    price: Number(product?.price || 0),
    image: String(product?.image || product?.img || product?.image_url || product?.images?.[0] || "/placeholder.png"),
  };
}

function normalizeDBRows(rows: any[] | null | undefined): CartItem[] {
  return (rows || []).map((row: any) => ({
    id: row.product_id,
    name: row.name,
    price: Number(row.price || 0),
    image: row.image || "/placeholder.png",
    quantity: Number(row.quantity || 0),
  }));
}

export function getCart(): CartItem[] {
  return read<CartItem[]>(CART_KEY, []);
}

export async function loadCart(passedUser?: any): Promise<CartItem[]> {
  console.log("[Cart] loadCart triggered");
  const user = passedUser;

  // GUEST MODE
  if (!user) {
    const local = read<CartItem[]>(CART_KEY, []);
    console.log("[Cart] Guest session, local items:", local.length);
    return local;
  }

  // LOGGED IN MODE
  console.log("[Cart] Logged-in session for user:", user.id);
  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("[Cart] loadCart DB Error:", error.message);
    // Fallback to local if DB fails? No, return empty to avoid conflicting state
    return [];
  }

  const items = normalizeDBRows(data);
  console.log("[Cart] DB items loaded:", items.length);
  
  // Keep local storage mirrored for quick access (no-sync)
  write(CART_KEY, items);
  notify();
  return items;
}

export async function handleAddToCart(product: any, passedUser?: any): Promise<void> {
  const item = snap(product);
  console.log("[Cart] addToCart intent:", item.id);
  const user = passedUser;

  // -------- GUEST --------
  if (!user) {
    console.log("[Cart] Guest AddToCart");
    let cart = read<CartItem[]>(CART_KEY, []);
    const existing = cart.find(i => i.id === item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    write(CART_KEY, cart);
    notify();
    return;
  }

  // -------- LOGGED IN --------
  console.log("[Cart] Logged-in AddToCart for:", user.id);
  const { data: existing, error: fetchError } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", item.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[Cart] AddToCart DB Fetch Error:", fetchError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("cart")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id);
    
    if (updateError) console.error("[Cart] Update Error:", updateError.message);
  } else {
    const { error: insertError } = await supabase.from("cart").insert({
      user_id: user.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });

    if (insertError) console.error("[Cart] Insert Error:", insertError.message);
  }

  // Reload to keep UI in sync
  await loadCart(user);
}

export const addToCart = handleAddToCart;

export async function updateQty(productId: string, quantity: number, passedUser?: any): Promise<void> {
  console.log(`[Cart] updateQty: ${productId} -> ${quantity}`);
  const user = passedUser;

  // GUEST
  if (!user) {
    let cart = read<CartItem[]>(CART_KEY, []);
    if (quantity <= 0) {
      cart = cart.filter(x => x.id !== productId);
    } else {
      const it = cart.find(x => x.id === productId);
      if (it) it.quantity = quantity;
    }
    write(CART_KEY, cart);
    notify();
    return;
  }

  // LOGGED IN
  if (quantity <= 0) {
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
    if (error) console.error("[Cart] Delete Error:", error.message);
  } else {
    const { error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("user_id", user.id)
      .eq("product_id", productId);
    if (error) console.error("[Cart] Update Qty Error:", error.message);
  }

  await loadCart(user);
}

export async function removeFromCart(productId: string, passedUser?: any): Promise<void> {
  await updateQty(productId, 0, passedUser);
}

export async function clearCart(passedUser?: any): Promise<void> {
  console.log("[Cart] clearCart intent");
  const user = passedUser;

  if (!user) {
    write(CART_KEY, []);
    notify();
    return;
  }

  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", user.id);
  
  if (error) console.error("[Cart] Clear Cart Error:", error.message);

  write(CART_KEY, []);
  notify();
}

/** 
 * Phase 6: Sync Local to DB on Login
 */
export async function syncLocalCartToDB(userId: string): Promise<void> {
  console.log("[Cart] Syncing Guest items to DB for:", userId);
  const localCart = read<CartItem[]>(CART_KEY, []);
  if (localCart.length === 0) return;

  for (const item of localCart) {
    // Check if user already has this prod in DB
    const { data: existing } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", item.id)
      .maybeSingle();

    if (existing) {
      // Merge quantity
      await supabase
        .from("cart")
        .update({ quantity: existing.quantity + item.quantity })
        .eq("id", existing.id);
    } else {
      // Insert new
      await supabase.from("cart").insert({
        user_id: userId,
        product_id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity
      });
    }
  }

  // Once synced, clear local
  localStorage.removeItem(CART_KEY);
  console.log("[Cart] Sync complete, local cleared.");
  await loadCart({ id: userId });
}

export async function asyncCartCount(): Promise<number> {
  const list = await loadCart();
  return list.reduce((n, item) => n + item.quantity, 0);
}

/* -------------- WISHLIST -------------- */
export async function loadWishlist(passedUser?: any): Promise<ItemSnapshot[]> {
  const user = passedUser;
  if (!user) {
    return read<ItemSnapshot[]>(WISHLIST_KEY, []);
  }

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id, name, price, image")
    .eq("user_id", user.id);

  if (error) {
    console.error("[Wishlist] load DB Error:", error.message);
    return read<ItemSnapshot[]>(WISHLIST_KEY, []); // fallback to local on error
  }

  const items: ItemSnapshot[] = (data || []).map(row => ({
    id: row.product_id,
    name: row.name,
    price: Number(row.price || 0),
    image: row.image || "/placeholder.png"
  }));

  // Sync local mirror
  write(WISHLIST_KEY, items);
  notify();
  return items;
}

export async function toggleWishlist(product: any, passedUser?: any): Promise<void> {
  const item = snap(product);
  const user = passedUser;

  if (!user) {
    // GUEST MODE
    let wishlist = read<ItemSnapshot[]>(WISHLIST_KEY, []);
    const existingIndex = wishlist.findIndex(i => i.id === item.id);

    if (existingIndex > -1) {
      wishlist.splice(existingIndex, 1);
    } else {
      wishlist.push(item);
    }

    write(WISHLIST_KEY, wishlist);
    notify();
    return;
  }

  // DB MODE
  const { data: existing, error: fetchError } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", item.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[Wishlist] Toggle Fetch Error:", fetchError.message);
    return;
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", existing.id);
    if (deleteError) console.error("[Wishlist] Delete Error:", deleteError.message);
  } else {
    const { error: insertError } = await supabase.from("wishlist").insert({
      user_id: user.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    });
    if (insertError) console.error("[Wishlist] Insert Error:", insertError.message);
  }

  // Final reload
  await loadWishlist(user);
}

export async function syncLocalWishlistToDB(userId: string): Promise<void> {
  console.log("[Wishlist] Starting Sync for user:", userId);
  const local = read<ItemSnapshot[]>(WISHLIST_KEY, []);
  if (local.length === 0) {
    console.log("[Wishlist] No local items to sync.");
    return;
  }

  try {
    for (const item of local) {
      const { data: existing, error: checkError } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", item.id)
        .maybeSingle();

      if (checkError) {
        console.error("WISHLIST SYNC ERROR (Check):", checkError);
        continue; // Skip faulty item but continue sync
      }

      if (!existing) {
        const { error: insertError } = await supabase.from("wishlist").insert({
          user_id: userId,
          product_id: item.id,
          name: item.name,
          price: item.price,
          image: item.image
        });
        
        if (insertError) {
          console.error("WISHLIST SYNC ERROR (Insert):", insertError);
        }
      }
    }

    // Success: Clear local
    write(WISHLIST_KEY, []);
    localStorage.removeItem(WISHLIST_KEY);
    console.log("[Wishlist] Sync complete. Local storage cleared.");
  } catch (syncErr) {
    console.error("WISHLIST SYNC CRITICAL FAILURE:", syncErr);
  }
  
  await loadWishlist({ id: userId });
}

export function getWishlist(): ItemSnapshot[] {
  return read<ItemSnapshot[]>(WISHLIST_KEY, []);
}

export function wishlistCount(): number {
  return read<ItemSnapshot[]>(WISHLIST_KEY, []).length;
}

export async function removeFromWishlist(id: string, passedUser?: any) {
  const user = passedUser;
  if (!user) {
    let wishlist = read<ItemSnapshot[]>(WISHLIST_KEY, []);
    wishlist = wishlist.filter(i => i.id !== id);
    write(WISHLIST_KEY, wishlist);
    notify();
    return;
  }

  await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", id);

  await loadWishlist(user);
}

/* ------------- COLLECTIONS ------------ */
export function getCollections(): Collections {
  return read<Collections>(COLLECTIONS_KEY, {});
}

export function addToCollection(p: any, name?: string) {
  const colls = getCollections();
  const s = snap(p);
  const target = (name || "Favorites").trim();
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

/**
 * STRATEGY: Hard clear all local persistence on Logout
 * Prevents session leakage.
 */
export function clearAllLocalData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(WISHLIST_KEY);
  localStorage.removeItem(COLLECTIONS_KEY);
  notify();
  console.log("[Bags] All local storage data cleared.");
}
