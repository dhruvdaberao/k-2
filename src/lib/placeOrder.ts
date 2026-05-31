import { supabase } from "@/lib/supabaseClient";

export type PlaceOrderResult = {
  success: boolean;
  orderId: string | null;
  displayId?: string | null;
  accessToken?: string | null;
  error: string | null;
};

let isOrderInFlight = false;

export async function handlePlaceOrder(customItems?: any[], deliveryDetails?: any, explicitUserId?: string | null, explicitUserEmail?: string | null): Promise<PlaceOrderResult> {
  if (isOrderInFlight) {
    return { success: false, orderId: null, error: "Order already in progress." };
  }

  isOrderInFlight = true;

  try {
    let user = null;
    let token = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        user = sessionData.session.user;
        token = sessionData.session.access_token;
      }
    } catch (e) {
      console.warn("[PlaceOrder] No active session found");
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

    const finalUserId = explicitUserId || user?.id;
    const finalUserEmail = explicitUserEmail || user?.email || deliveryDetails?.email;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("🔄 Calling server-side place-order API...");
    const res = await fetch("/api/checkout/place-order", {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: cartItems,
        deliveryDetails,
        userId: finalUserId,
        userEmail: finalUserEmail
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
