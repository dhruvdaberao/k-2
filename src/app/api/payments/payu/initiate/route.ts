import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
  // Rate Limiting (5 requests per 10 minutes)
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(`rate_limit:payu:${ip}`);
    
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

    // Basic validation
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

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
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user) {
        actualUserId = user.id;
        actualUserEmail = user.email || actualUserEmail;
      }
    }

    const email = actualUserEmail || deliveryDetails?.email || 'guest@keshvicrafts.com';
    const firstname = deliveryDetails?.fullName || 'Guest';
    const phone = deliveryDetails?.phoneNumber || '0000000000';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // --- SECURE PRICE VALIDATION ---
    const productIds = items.map((i: any) => i.product_id || i.id);
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, price, category, discount_active, discount_percentage')
      .in('id', productIds);

    const { data: dbCategories, error: catError } = await supabase
      .from('categories')
      .select('name, discount_active, discount_percentage');

    if (prodError || !dbProducts) {
      return NextResponse.json({ success: false, error: 'Failed to validate products' }, { status: 500 });
    }

    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const dbProd = dbProducts.find(p => p.id === (item.product_id || item.id));
      if (!dbProd) throw new Error(`Product not found: ${item.name}`);
      
      let realPrice = Number(dbProd.price);
      
      // Calculate effective price based on discounts
      const dbCat = dbCategories?.find(c => c.name === dbProd.category);
      if (dbCat?.discount_active && dbCat?.discount_percentage) {
        realPrice = Math.round(realPrice - (realPrice * Number(dbCat.discount_percentage) / 100));
      } else if (dbProd.discount_active && dbProd.discount_percentage) {
        realPrice = Math.round(realPrice - (realPrice * Number(dbProd.discount_percentage) / 100));
      }
      
      const qty = Number(item.quantity);
      
      if (!Number.isInteger(qty) || qty <= 0 || qty > 20) {
        throw new Error(`Invalid quantity for product: ${item.name}. Maximum 20 per item allowed.`);
      }

      subtotal += (realPrice * qty);
      
      return {
        ...item,
        price: realPrice
      };
    });

    if (subtotal <= 0) {
      return NextResponse.json({ success: false, error: 'Order value must be greater than zero' }, { status: 400 });
    }

    const shippingCharge = subtotal >= 650 ? 0 : 40;
    const totalAmount = subtotal + shippingCharge;
    const amountStr = parseFloat(totalAmount.toString()).toFixed(2);
    const txnid = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const productinfo = 'Keshvi Crafts Order';
    
    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!key || !salt) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Temporarily store order in DB as "pending_payment"

    const displayId = `KC-${Date.now()}`;
    const accessToken = crypto.randomUUID();

    const orderPayload: any = {
      email: email,
      total_amount: totalAmount,
      status: "pending_payment", // Will only be marked 'paid' in callback
      payment_method: "Online",
      address: deliveryDetails ? `${deliveryDetails.address}, ${deliveryDetails.city}, ${deliveryDetails.state}, ${deliveryDetails.country} - ${deliveryDetails.pincode}` : "No Address Provided",
      display_id: displayId,
      access_token: accessToken
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

    const { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }

    const itemsPayload = validatedItems.map((item: any) => ({
      order_id: newOrder.id,
      product_id: item.product_id || item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image || ""
    }));

    await supabase.from("order_items").insert(itemsPayload);

    // 2. Generate Hash
    const surl = `${siteUrl}/api/payments/payu/callback`;
    const furl = `${siteUrl}/api/payments/payu/callback`;

    const udf1 = newOrder.id;

    // Hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    // Since we use udf1, we append 10 empty pipes after it to reach salt.
    const hashString = `${key}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}|${udf1}||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    return NextResponse.json({
      success: true,
      payload: {
        key,
        txnid,
        amount: amountStr,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        udf1: newOrder.id // Pass the DB order ID in udf1 for easy reference in callback
      },
      payuUrl: process.env.PAYU_ENV === 'production' 
        ? 'https://secure.payu.in/_payment' 
        : 'https://test.payu.in/_payment'
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
