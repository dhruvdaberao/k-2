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
    let user = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        user = sessionData.session.user;
      }
    } catch (e) {
      console.warn("[PlaceOrder] No active session found (Guest Mode)");
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

    console.log("🔄 Calling server-side place-order API...");
    const res = await fetch("/api/checkout/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems,
        deliveryDetails,
        userId: user?.id,
        userEmail: user?.email || deliveryDetails?.email
      })
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to place order");
    }

    return { 
      success: true, 
      orderId: result.orderId, 
      displayId: result.displayId, 
      accessToken: result.accessToken, 
      error: null 
    };

  } catch (err: any) {
    console.error("Critical PlaceOrder Error:", err);
    return { success: false, orderId: null, error: err.message || "Failed to place order" };
  } finally {
    isOrderInFlight = false;
  }
}
