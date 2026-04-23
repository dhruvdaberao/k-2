import { supabase } from "@/lib/supabaseClient";

export type PlaceOrderResult = {
  success: boolean;
  orderId: string | null;
  displayId?: string | null;
  accessToken?: string | null;
  error: string | null;
};

let isOrderInFlight = false;

export async function handlePlaceOrder(customItems?: any[], deliveryDetails?: any): Promise<PlaceOrderResult> {
  if (isOrderInFlight) {
    return { success: false, orderId: null, error: "Order already in progress." };
  }

  isOrderInFlight = true;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && !deliveryDetails) {
      console.error("[PlaceOrder] Auth validation failed:", authError);
      return { success: false, orderId: null, error: "Authentication failed. Please login again." };
    }

    if (!user && !deliveryDetails) {
      return { success: false, orderId: null, error: "Please login to place order." };
    }

    let cartItems = customItems;
    if (!cartItems || cartItems.length === 0) {
      if (user) {
        const { data } = await supabase.from("cart").select("*").eq("user_id", user.id);
        cartItems = data || [];
      } else {
        return { success: false, orderId: null, error: "Cart is empty." };
      }
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, orderId: null, error: "Cart is empty." };
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const displayId = `KC-${Date.now()}`;
    const email = user?.email || deliveryDetails?.email;
    if (!email) {
      return { success: false, orderId: null, error: "Email is required to place order." };
    }

    const accessToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // 1. CREATE ORDER (Omit user_id if null to satisfy strict RLS)
    const orderPayload: any = {
      ...(user?.id ? { user_id: user.id } : {}),
      email: email, // Root level email for admin search
      total_amount: totalAmount,
      status: "placed",
      payment_method: "COD",
      address: deliveryDetails ? `${deliveryDetails.address}, ${deliveryDetails.city} - ${deliveryDetails.pincode}` : "No Address Provided",
      display_id: displayId,
      access_token: accessToken,
    };

    // Try adding delivery_address JSON if you have it
    if (deliveryDetails) {
      orderPayload.delivery_address = {
        full_name: deliveryDetails.fullName || "",
        phone: deliveryDetails.phoneNumber || "",
        address_line: deliveryDetails.address || "",
        city: deliveryDetails.city || "",
        pincode: deliveryDetails.pincode || "",
        email: email
      };
    }

    console.log("📦 Creating order record in Supabase...");
    let { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (insertError) {
      console.error("[PlaceOrder] First Insert Failed:", insertError);
      // Fallback: If 400 is due to new columns or RLS, try again with original minimal schema
      if (insertError.message.includes("delivery_address") || insertError.code === "PGRST204" || insertError.message.includes("column") || insertError.message.includes("policy")) {
        console.warn("[PlaceOrder] Attempting fallback insert without delivery_address...");
        const fallbackPayload = { ...orderPayload };
        delete fallbackPayload.delivery_address;
        
        const retry = await supabase.from("orders").insert(fallbackPayload).select("id").single();
        if (retry.error) {
          console.error("[PlaceOrder] Fallback Insert Also Failed:", retry.error);
          throw new Error(retry.error.message);
        }
        newOrder = retry.data; 
      } else {
        throw new Error(insertError.message);
      }
    }

    const orderId = newOrder?.id;
    if (!orderId) throw new Error("Order created but ID missing");

    // 2. CREATE ITEMS
    const itemsPayload = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image || ""
    }));

    console.log("📦 Creating order items...");
    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsError) throw new Error(itemsError.message);

    // CLEAN UP
    if (user) {
      await supabase.from("cart").delete().eq("user_id", user.id);
    }

    return { success: true, orderId: orderId, displayId, accessToken, error: null };
  } catch (err: any) {
    console.error("Critical PlaceOrder Error:", err);
    return { success: false, orderId: null, error: err.message || "Failed to place order" };
  } finally {
    isOrderInFlight = false;
  }
}
