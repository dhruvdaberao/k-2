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

export async function loadCart(): Promise<CartItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("USER:", user);

  if (!user) {
    const local = read<CartItem[]>(CART_KEY, []);
    return local;
  }

  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", user.id);

  console.log("DB RESPONSE:", data);

  if (error) {
    console.error("[Cart] loadCart DB error", error);
    return [];
  }

  const items = normalizeDBRows(data);
  write(CART_KEY, items);
  return items;
}

export async function syncLocalCartToDB(userId?: string): Promise<void> {
  const resolvedUserId = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!resolvedUserId) return;

  const localCart = read<CartItem[]>(CART_KEY, []);
  if (localCart.length === 0) return;

  const { data: dbRows, error: fetchError } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", resolvedUserId);

  if (fetchError) {
    console.error("[Cart] syncLocalCartToDB fetch error", fetchError);
    return;
  }

  const dbItems = normalizeDBRows(dbRows);

  for (const localItem of localCart) {
    const dbMatch = dbItems.find((row) => row.id === localItem.id);

    if (dbMatch) {
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: dbMatch.quantity + localItem.quantity })
        .eq("user_id", resolvedUserId)
        .eq("product_id", localItem.id);

      if (updateError) {
        console.error("[Cart] sync update error", updateError);
      }
    } else {
      const { error: insertError } = await supabase.from("cart").insert({
        user_id: resolvedUserId,
        product_id: localItem.id,
        name: localItem.name,
        price: localItem.price,
        image: localItem.image,
        quantity: localItem.quantity,
      });

      if (insertError) {
        console.error("[Cart] sync insert error", insertError);
      }
    }
  }

  localStorage.removeItem(CART_KEY);
  notify();
}

export async function handleAddToCart(product: any): Promise<void> {
  const item = snap(product);
  console.log("ADDING:", item);

  const { data: { user } } = await supabase.auth.getUser();
  console.log("USER:", user);

  if (!user) {
    const cart = read<CartItem[]>(CART_KEY, []);
    const existing = cart.find((i) => i.id === item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    write(CART_KEY, cart);
    notify();
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", item.id)
    .maybeSingle();

  if (existingError) {
    console.error("[Cart] existing row fetch error", existingError);
  }

  if (existing) {
    const { data, error } = await supabase
      .from("cart")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id)
      .select();

    console.log("DB RESPONSE:", data);
    if (error) console.error("[Cart] update error", error);
  } else {
    const { data, error } = await supabase.from("cart").insert({
      user_id: user.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    }).select();

    console.log("DB RESPONSE:", data);
    if (error) console.error("[Cart] insert error", error);
  }

  const latest = await loadCart();
  write(CART_KEY, latest);
  notify();
}

export const addToCart = handleAddToCart;

export async function updateQty(productId: string, quantity: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("USER:", user);

  if (!user) {
    let cart = read<CartItem[]>(CART_KEY, []);
    const existing = cart.find((i) => i.id === productId);

    if (!existing) return;

    if (quantity <= 0) {
      cart = cart.filter((i) => i.id !== productId);
    } else {
      existing.quantity = quantity;
    }

    write(CART_KEY, cart);
    notify();
    return;
  }

  if (quantity <= 0) {
    const { data, error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .select();

    console.log("DB RESPONSE:", data);
    if (error) console.error("[Cart] delete via qty error", error);
  } else {
    const { data, error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .select();

    console.log("DB RESPONSE:", data);
    if (error) console.error("[Cart] qty update error", error);
  }

  const latest = await loadCart();
  write(CART_KEY, latest);
  notify();
}

export async function removeFromCart(productId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("USER:", user);

  if (!user) {
    const cart = read<CartItem[]>(CART_KEY, []).filter((i) => i.id !== productId);
    write(CART_KEY, cart);
    notify();
    return;
  }

  const { data, error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .select();

  console.log("DB RESPONSE:", data);
  if (error) console.error("[Cart] remove error", error);

  const latest = await loadCart();
  write(CART_KEY, latest);
  notify();
}

export async function clearCart(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("USER:", user);

  if (!user) {
    write(CART_KEY, []);
    notify();
    return;
  }

  const { data, error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", user.id)
    .select();

  console.log("DB RESPONSE:", data);
  if (error) console.error("[Cart] clear error", error);

  write(CART_KEY, []);
  notify();
}

export async function asyncCartCount(): Promise<number> {
  const list = await loadCart();
  return list.reduce((n, item) => n + item.quantity, 0);
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
  const target = (name || prompt("Add to which collection?", "keyring") || "").trim();
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
