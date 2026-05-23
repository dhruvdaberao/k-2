import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const authToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Create an auth client if token exists
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    authToken ? { global: { headers: { Authorization: `Bearer ${authToken}` } } } : {}
  );
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // 1. Fetch the order (bypassing RLS)
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .or(`id.eq.${orderId},display_id.eq.${orderId}`)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Validate access
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    const isOwner = user && user.id === order.user_id;
    const hasValidToken = token && token === order.access_token;

    if (!isOwner && !hasValidToken) {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    // 3. Structured response
    const structuredOrder = {
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      delivery_address: typeof order.delivery_address === "string" 
        ? JSON.parse(order.delivery_address) 
        : order.delivery_address,
      items: order.order_items || []
    };

    return NextResponse.json(structuredOrder);
  } catch (err: any) {
    console.error("[GetOrder API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
