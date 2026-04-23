import { supabase } from "@/lib/supabaseClient";
// lib/placeOrder.ts
// Full checkout pipeline (DB layer):
//   1. Authenticate user
//   2. Fetch & validate cart items
//   3. Calculate & validate total
//   4. Create order row
//   5. Bulk-insert order_items (rollback order on failure)
//   6. Clear cart from DB (with retry)
//   7. Return order ID
// Redirect & UI reset are handled by the calling component.


/* Address is now passed dynamically from the checkout form via deliveryDetails */

export type PlaceOrderResult = {
  success: boolean;
  orderId: string | null;
  displayId?: string | null;
  error: string | null;
};

/**
 * Module-level lock to prevent concurrent order submissions.
 * Protects against rapid double-clicks even if the UI guard is bypassed.
 */
let isOrderInFlight = false;

/**
 * handlePlaceOrder — Full checkout pipeline (database layer)
 *
 * 1. Fetches the currently authenticated user via supabase.auth.getUser()
 * 2. Fetches all cart rows for that user and validates each item
 * 3. Calculates total_amount = Σ(price × quantity), guards against NaN
 * 4. Inserts a new row into `orders`
 * 5. Bulk-inserts all cart items into `order_items` (rolls back order on failure)
 * 6. Deletes all cart items for the user (retries once on failure)
 * 7. Returns the created order's id
 */
export async function handlePlaceOrder(customItems?: any[], deliveryDetails?: any): Promise<PlaceOrderResult> {

  // ── Duplicate-submission guard ─────────────────────────────────────
  if (isOrderInFlight) {
    console.warn("[PlaceOrder] Order already in progress — ignoring duplicate call.");
    return { success: false, orderId: null, error: "Order is already being processed." };
  }

  isOrderInFlight = true;

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const user = session?.user;

    console.log("FIXED USER:", user);

    if (!user) {
      console.error("User not authenticated, no session found");
      return {
        success: false,
        orderId: null,
        error: "Please login to place order"
      };
    }

    // ── 2. Fetch & validate cart items ─────────────────────────────────
    let cartItems = customItems;

    if (!cartItems || cartItems.length === 0) {
      const { data, error: cartError } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", user.id);

      if (cartError) {
        console.error("[PlaceOrder] Cart fetch error:", cartError.message);
        return { success: false, orderId: null, error: "Failed to load your cart. Please try again." };
      }
      cartItems = data;
    }

    if (!cartItems || cartItems.length === 0) {
      console.error("[PlaceOrder] Cart is empty.");
      return { success: false, orderId: null, error: "Your cart/order is empty." };
    }

    // Validate each item has the required fields and sane values
    const validItems = cartItems.filter((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      if (!item.product_id || !item.name) {
        console.warn("[PlaceOrder] Skipping item with missing product_id or name:", item);
        return false;
      }
      if (!Number.isFinite(price) || price <= 0) {
        console.warn("[PlaceOrder] Skipping item with invalid price:", item);
        return false;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        console.warn("[PlaceOrder] Skipping item with invalid quantity:", item);
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      console.error("[PlaceOrder] No valid items in cart after validation.");
      return { success: false, orderId: null, error: "Your cart has no valid items." };
    }

    // ── 3. Calculate & validate total ──────────────────────────────────
    const totalAmount = validItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      console.error("[PlaceOrder] Invalid total amount:", totalAmount);
      return { success: false, orderId: null, error: "Could not calculate order total. Please check your cart." };
    }

    // ── 4. Insert into `orders` table ──────────────────────────────────
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const displayId = `KC-${dateStr}-${randomCode}`;

    const delivery_address = deliveryDetails ? {
      full_name: deliveryDetails.fullName || deliveryDetails.full_name || "",
      phone: deliveryDetails.phoneNumber || deliveryDetails.phone || "",
      address_line: deliveryDetails.address || deliveryDetails.address_line || "",
      city: deliveryDetails.city || "",
      state: deliveryDetails.state || "",
      pincode: deliveryDetails.pincode || ""
    } : null;

    // Fallback string for legacy components that rely on the old text address field
    const fallbackAddressString = deliveryDetails 
      ? `${delivery_address?.address_line}, ${delivery_address?.city}, ${delivery_address?.state} - ${delivery_address?.pincode}`
      : "No Address Provided";

    // Try inserting with delivery_address first; if the column doesn't exist yet, retry without it
    let newOrder: any = null;
    let insertError: any = null;

    const orderPayload: any = {
      user_id: user.id,
      total_amount: totalAmount,
      status: "placed",
      payment_method: "COD",
      payment_status: "pending",
      address: fallbackAddressString,
      display_id: displayId,
    };

    // Attempt with delivery_address column (requires migration to have been run)
    const result1 = await supabase
      .from("orders")
      .insert({ ...orderPayload, delivery_address: delivery_address })
      .select("id")
      .single();

    if (result1.error && result1.error.message?.includes("delivery_address")) {
      // Column doesn't exist yet — retry without it
      console.warn("[PlaceOrder] delivery_address column not found, inserting without it");
      const result2 = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();
      newOrder = result2.data;
      insertError = result2.error;
    } else {
      newOrder = result1.data;
      insertError = result1.error;
    }

    if (insertError) {
      console.error("[PlaceOrder] Order insert error:", insertError.message);
      return { success: false, orderId: null, error: "Failed to create order. Please try again." };
    }

    if (!newOrder?.id) {
      console.error("[PlaceOrder] Order created but no ID returned.");
      return { success: false, orderId: null, error: "Order was created but could not be confirmed." };
    }

    // ── 5. Bulk-insert cart items into `order_items` ───────────────────
    const orderItemsPayload = validItems.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image || "",
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (orderItemsError) {
      console.error("[PlaceOrder] Order items insert error:", orderItemsError.message);

      // Rollback: delete the orphaned order row to avoid a broken state
      const { error: rollbackError } = await supabase
        .from("orders")
        .delete()
        .eq("id", newOrder.id);

      if (rollbackError) {
        console.error("[PlaceOrder] Rollback failed — orphan order remains:", rollbackError.message);
      } else {
        console.log("[PlaceOrder] Rolled back order:", newOrder.id);
      }

      return {
        success: false,
        orderId: null,
        error: "Failed to save order items. No order was created. Please try again.",
      };
    }

    console.log(
      `[PlaceOrder] ✅ ${orderItemsPayload.length} item(s) saved to order_items for order ${newOrder.id}`
    );

    // ── 6. Clear cart from DB (with retry) ─────────────────────────────
    let cartCleared = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { error: clearCartError } = await supabase
        .from("cart")
        .delete()
        .eq("user_id", user.id);

      if (!clearCartError) {
        console.log("[PlaceOrder] 🧹 Cart cleared for user:", user.id);
        cartCleared = true;
        break;
      }

      console.error(`[PlaceOrder] Cart clear attempt ${attempt} failed:`, clearCartError.message);
    }

    if (!cartCleared) {
      // Non-fatal: order is placed, cart will just show stale items until next refresh
      console.warn("[PlaceOrder] Cart could not be cleared after 2 attempts (non-fatal).");
    }

    // ── 7. Send "Order Placed" Email (Non-Blocking) ────────────────────
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_placed",
          userEmail: user.email,
          orderId: displayId,
          items: validItems.map(item => ({
            name: item.name,
            quantity: Number(item.quantity),
            price: Number(item.price)
          })),
          total: totalAmount
        })
      });
      console.log("[PlaceOrder] ✅ Email triggered.");
    } catch (emailErr) {
      console.error("[PlaceOrder] Non-fatal: Failed to trigger email", emailErr);
    }

    // ── 8. Return the created order ID ─────────────────────────────────
    console.log(`[PlaceOrder] ✅ Order placed successfully. ID: ${displayId}`);
    return { success: true, orderId: newOrder.id, displayId, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[PlaceOrder] Unexpected error:", message);
    return { success: false, orderId: null, error: message };
  } finally {
    isOrderInFlight = false;
  }
}
