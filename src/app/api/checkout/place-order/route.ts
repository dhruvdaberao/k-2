import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('🔄 [API PlaceOrder] Hit');

  try {
    const body = await req.json();
    const { items, deliveryDetails, userId, userEmail } = body;

    // Basic validation
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    const email = userEmail || deliveryDetails?.email;
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Service-role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      console.error('🔴 [API PlaceOrder] Missing Service Key');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const displayId = `KC-${Date.now()}`;
    const accessToken = crypto.randomUUID();

    // 1. Build order payload
    const orderPayload: any = {
      email: email,
      total_amount: totalAmount,
      status: "placed",
      payment_method: "COD",
      address: deliveryDetails ? `${deliveryDetails.address}, ${deliveryDetails.city}, ${deliveryDetails.state}, ${deliveryDetails.country} - ${deliveryDetails.pincode}` : "No Address Provided",
      display_id: displayId,
      access_token: accessToken,
    };

    if (userId) orderPayload.user_id = userId;

    if (deliveryDetails) {
      orderPayload.delivery_address = {
        full_name: deliveryDetails.fullName || "",
        phone: deliveryDetails.phoneNumber || "",
        address_line: deliveryDetails.address || "",
        city: deliveryDetails.city || "",
        state: deliveryDetails.state || "",
        country: deliveryDetails.country || "",
        pincode: deliveryDetails.pincode || "",
        email: email
      };
    }

    // 2. Insert Order
    const { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (insertError) {
      console.error('🔴 [API PlaceOrder] Insert Error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    const orderId = newOrder?.id;

    // 3. Insert Items
    const itemsPayload = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image || ""
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsError) {
      console.error('🔴 [API PlaceOrder] Items Insert Error:', itemsError);
      return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
    }

    // 4. Cleanup Cart if userId exists
    if (userId) {
      await supabase.from("cart").delete().eq("user_id", userId);
    }

    console.log(`✅ [API PlaceOrder] Order Created: ${displayId}`);

    return NextResponse.json({ 
      success: true, 
      orderId, 
      displayId, 
      accessToken 
    });

  } catch (err: any) {
    console.error('🔴 [API PlaceOrder] Critical Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
