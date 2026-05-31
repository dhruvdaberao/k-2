import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
});

export async function POST(req: Request) {
  console.log('🔄 [API PlaceOrder] Hit');

  // Rate Limiting (5 requests per 10 minutes)
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(`rate_limit:checkout:${ip}`);
    
    if (!success) {
      console.warn(`🔴 Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
  } catch (error) {
    console.error('🔴 [Redis Error] Rate limiting failed:', error);
    // Proceed without rate limiting if Redis fails (fail-open)
  }

  try {
    const body = await req.json();
    const { items, deliveryDetails, userEmail } = body;

    // Secure User Validation via JWT
    let actualUserId = null;
    let actualUserEmail = userEmail;
    
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        actualUserId = user.id;
        actualUserEmail = user.email || actualUserEmail;
      }
    }

    // Basic validation
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    const email = actualUserEmail || deliveryDetails?.email;
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

    // --- SECURE PRICE VALIDATION ---
    const productIds = items.map((i: any) => i.product_id || i.id);
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds);

    if (prodError || !dbProducts) {
      return NextResponse.json({ success: false, error: 'Failed to validate products' }, { status: 500 });
    }

    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const dbProd = dbProducts.find(p => p.id === (item.product_id || item.id));
      if (!dbProd) throw new Error(`Product not found: ${item.name}`);
      const realPrice = Number(dbProd.price);
      const qty = Number(item.quantity);
      subtotal += (realPrice * qty);
      
      return {
        ...item,
        price: realPrice
      };
    });

    const shippingCharge = subtotal >= 650 ? 0 : 40;
    const grandTotal = subtotal + shippingCharge;
    
    const displayId = `KC-${Date.now()}`;
    const accessToken = crypto.randomUUID();

    // --- ATOMIC STOCK DECREMENT ---
    const stockPayload = validatedItems.map((item: any) => ({
      product_id: item.product_id || item.id,
      quantity: Number(item.quantity)
    }));

    const { error: stockError } = await supabase.rpc('decrement_stock', { items: stockPayload });

    if (stockError) {
      console.error('🔴 [API PlaceOrder] Stock Error:', stockError);
      return NextResponse.json({ 
        success: false, 
        error: 'One or more items in your cart just went out of stock.' 
      }, { status: 409 });
    }

    // 1. Build order payload
    const orderPayload: any = {
      email: email,
      total_amount: grandTotal,
      status: "placed",
      payment_method: "COD",
      address: deliveryDetails ? `${deliveryDetails.address}, ${deliveryDetails.city}, ${deliveryDetails.state}, ${deliveryDetails.country} - ${deliveryDetails.pincode}` : "No Address Provided",
      display_id: displayId,
      access_token: accessToken,
    };

    if (actualUserId) orderPayload.user_id = actualUserId;

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
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }

    const orderId = newOrder?.id;

    // 3. Insert Items
    const itemsPayload = validatedItems.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id || item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image || ""
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsError) {
      console.error('🔴 [API PlaceOrder] Items Insert Error:', itemsError);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }

    // 4. Cleanup Cart if actualUserId exists
    if (actualUserId) {
      await supabase.from("cart").delete().eq("user_id", actualUserId);
    }

    console.log(`✅ [API PlaceOrder] Order Created: ${displayId}`);

    // 5. Send Email securely from backend
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const emailPayload = {
      type: "order_placed",
      email: email,
      orderId: displayId,
      items: validatedItems.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total: grandTotal,
      subtotal: subtotal,
      shipping: shippingCharge,
      discount: 0,
      paymentMethod: 'Cash on Delivery',
      invoiceUrl: `${siteUrl}/api/invoice?orderId=${displayId}&token=${accessToken}`,
      customerName: deliveryDetails?.fullName || "Customer"
    };

    try {
      await fetch(`${siteUrl}/api/send-email`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-secret": serviceKey!
        },
        body: JSON.stringify(emailPayload)
      });
    } catch(e) {
      console.error("🔴 [API PlaceOrder] Email failed to send", e);
    }

    return NextResponse.json({ 
      success: true, 
      orderId, 
      displayId, 
      accessToken 
    });

  } catch (err: any) {
    console.error('🔴 [API PlaceOrder] Critical Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
