import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, deliveryDetails, userEmail, userId, calculatedTotal } = body;

    const email = userEmail || deliveryDetails?.email || 'guest@keshvicrafts.com';
    const firstname = deliveryDetails?.fullName || 'Guest';
    const phone = deliveryDetails?.phoneNumber || '0000000000';
    
    let totalAmount = calculatedTotal;
    if (!totalAmount) {
      totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    }
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

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

    const { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    const itemsPayload = items.map((item: any) => ({
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
