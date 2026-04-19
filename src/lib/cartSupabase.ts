// lib/cartSupabase.ts
import { supabase } from "./supabaseClient";

export type CartDBCore = {
  id?: string;
  user_id: string;
  product_id: string;
  quantity: number;
};

export async function fetchDBCart(userId: string): Promise<CartDBCore[]> {
  console.log(`[Supabase] Fetching cart for user: ${userId}`);
  const { data, error } = await supabase.from("cart").select("*").eq("user_id", userId);
  if (error) {
    console.error("[Supabase] Cart Fetch Error:", error);
    return [];
  }
  console.log(`[Supabase] Row count: ${data?.length || 0}`);
  return data as CartDBCore[];
}

/** 
 * Atomic-like update/insert for DB cart items. 
 * If quantity <= 0, it removes the item.
 */
export async function updateDBCartItem(userId: string, productId: string, quantity: number) {
  console.log(`[Supabase] updateDBCartItem request: user=${userId}, product=${productId}, qty=${quantity}`);

  if (quantity <= 0) {
    return removeDBCartItem(userId, productId);
  }

  // We try to find the existing row ID first to ensure we target the right record
  const { data: existing, error: fetchErr } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[Supabase] Check Error:", fetchErr);
    // Continue anyway or throw? Let's try to insert if fetch failed but item might not exist
  }

  if (existing?.id) {
    console.log(`[Supabase] Updating existing row: ${existing.id}`);
    const { error: upErr } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("id", existing.id);
    
    if (upErr) {
      console.error("[Supabase] Update failed, trying manual upsert fallback:", upErr);
      // Fallback: search by user/product directly in update
      await supabase.from("cart").update({ quantity }).eq("user_id", userId).eq("product_id", productId);
    }
  } else {
    console.log("[Supabase] Inserting new cart row");
    const { error: insErr } = await supabase
      .from("cart")
      .insert([{ user_id: userId, product_id: productId, quantity }]);
    
    if (insErr) {
      console.error("[Supabase] Insert failed:", insErr);
      // Last resort: maybe it WAS created between check and insert?
      await supabase.from("cart").update({ quantity }).eq("user_id", userId).eq("product_id", productId);
    }
  }
}

export async function removeDBCartItem(userId: string, productId: string) {
  console.log(`[Supabase] Removing product: ${productId}`);
  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) console.error("[Supabase] Delete Error:", error);
  else console.log("[Supabase] Delete Success");
}

export async function clearDBCart(userId: string) {
  console.log(`[Supabase] Clearing all items for user: ${userId}`);
  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", userId);
  if (error) console.error("[Supabase] Clear Error:", error);
  else console.log("[Supabase] Clear Success");
}

export async function syncLocalCartToDB(userId: string) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("cart");
  if (!raw) return;

  try {
    const localCart: any[] = JSON.parse(raw);
    if (!localCart || localCart.length === 0) return;

    console.log(`[Sync] Starting migration of ${localCart.length} items to Supabase...`);
    const dbCart = await fetchDBCart(userId);

    for (const item of localCart) {
      const pId = item.id;
      const qty = item.quantity;
      
      console.log(`[Sync] Processing item: ${pId} (Qty: ${qty})`);
      const dbMatch = dbCart.find(x => x.product_id === pId);

      if (dbMatch) {
        const totalQty = dbMatch.quantity + qty;
        console.log(`[Sync] Merging: ${pId} (${qty} + ${dbMatch.quantity} = ${totalQty})`);
        await updateDBCartItem(userId, pId, totalQty);
      } else {
        console.log(`[Sync] Creating new entry: ${pId} (Qty: ${qty})`);
        await updateDBCartItem(userId, pId, qty);
      }
    }

    console.log("[Sync] Migration complete. Purging localStorage.");
    localStorage.removeItem("cart");
    window.dispatchEvent(new CustomEvent("bag:changed"));
  } catch (err) {
    console.error("[Sync] Failed:", err);
  }
}
