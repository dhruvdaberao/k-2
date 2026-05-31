import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Bypass RLS to allow checking if the user actually has a delivered order for this product
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const supabaseAuth = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!productId || !user) {
    return NextResponse.json({ error: "Missing productId or unauthorized" }, { status: 400 });
  }

  try {
    const { data: orderChecks, error: orderError } = await supabaseAdmin
      .from("order_items")
      .select("order_id, orders!inner(id, status, user_id)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .eq("orders.status", "delivered");

    if (orderError) {
      console.error("[Eligibility Check] Error:", orderError);
      return NextResponse.json({ eligible: false }, { status: 500 });
    }

    if (!orderChecks || orderChecks.length === 0) {
      return NextResponse.json({ eligible: false });
    }

    return NextResponse.json({ eligible: true });
  } catch (err) {
    console.error("[Eligibility Check] Catch Error:", err);
    return NextResponse.json({ eligible: false }, { status: 500 });
  }
}
