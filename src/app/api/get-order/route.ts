import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  cookies(); // Force dynamic rendering and opt out of Next.js static caching
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const authToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  
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
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId);
    let query = supabaseAdmin.from("orders").select("*, order_items(*)");
    
    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("display_id", orderId);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error) throw error;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Validate access
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    const isAdmin = user && user.email === 'keshvicrafts@gmail.com';
    const isOwner = user && user.id === order.user_id;
    const hasValidToken = token && token === order.access_token;

    if (!isAdmin && !isOwner && !hasValidToken) {
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
