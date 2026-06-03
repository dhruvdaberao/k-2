import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const {
      status,
      firstname,
      amount,
      txnid,
      hash,
      key,
      productinfo,
      email,
      udf1, // This holds our DB order ID
      error,
      error_Message
    } = data;

    const salt = process.env.PAYU_MERCHANT_SALT;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!salt) {
      return NextResponse.redirect(`${siteUrl}/payment/failure?error=server_error`, 303);
    }

    // PayU reverse hash formula:
    // salt|status||||||||||udf1|email|firstname|productinfo|amount|txnid|key
    // Note: If additional UDFs are used, they must be included in reverse order (udf5|udf4|udf3|udf2|udf1).
    // We only passed udf1.
    const reverseHashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Hash Mismatch (Possible Tampering)
    if (calculatedHash !== hash) {
      console.error("[PayU Callback] Hash mismatch detected!");
      if (udf1) {
        // Delete the pending order
        await supabase.from("orders").delete().eq("id", udf1);
      }
      return NextResponse.redirect(`${siteUrl}/payment/failure?error=hash_mismatch`, 303);
    }

    // Payment Failed
    if (status !== 'success') {
      console.warn(`[PayU Callback] Payment failed: ${error_Message || error}`);
      if (udf1) {
        // As requested by user: "If failed: do NOT create order" - so we delete the pending one.
        await supabase.from("orders").delete().eq("id", udf1);
      }
      return NextResponse.redirect(`${siteUrl}/payment/failure?error=payment_failed&msg=${encodeURIComponent(error_Message || 'Transaction Failed')}`, 303);
    }

    // Payment Successful
    if (udf1) {
      // Mark the order as paid
      await supabase.from("orders").update({ status: "paid" }).eq("id", udf1);
      
      const { data: orderData } = await supabase.from("orders").select("*, order_items(*)").eq("id", udf1).single();
      
      if (orderData) {
        // --- ATOMIC STOCK DECREMENT ---
        if (orderData.order_items && orderData.order_items.length > 0) {
          const stockPayload = orderData.order_items.map((item: any) => ({
            product_id: item.product_id,
            quantity: Number(item.quantity)
          }));
          const { error: stockError } = await supabase.rpc('decrement_stock', { items: stockPayload });
          if (stockError) {
            console.error('🔴 [API PayU Callback] Stock Error:', stockError);
          }
        }

        // Clear the user's cart if they have a registered account
        if (orderData.user_id) {
          await supabase.from("cart").delete().eq("user_id", orderData.user_id);
        }

        // Send order confirmation email
        const addr = orderData.delivery_address || (typeof orderData.address === 'string' ? { full_name: orderData.address } : orderData.address) || {};
        const emailPayload = {
          type: "order_placed",
          email: orderData.email || addr.email || "",
          orderId: orderData.display_id || udf1,
          items: (orderData.order_items || []).map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
          total: orderData.total_amount,
          subtotal: orderData.total_amount, // Approximated
          shipping: orderData.shipping_charge || 0,
          discount: orderData.discount_amount || 0,
          paymentMethod: 'Online Payment',
          invoiceUrl: `${siteUrl}/api/invoice?orderId=${orderData.display_id || udf1}&token=${orderData.access_token}`,
          customerName: addr.full_name || addr.name || "Customer"
        };
        
        try {
           await fetch(`${siteUrl}/api/send-email`, {
             method: "POST",
             headers: { 
               "Content-Type": "application/json",
               "x-internal-secret": serviceKey 
             },
             body: JSON.stringify(emailPayload)
           });
        } catch(e) { console.error("[PayU Callback] Email failed", e) }
      }
      
      const displayId = orderData?.display_id || udf1;
      const token = orderData?.access_token || "";
      return NextResponse.redirect(`${siteUrl}/order-success?orderId=${displayId}&token=${token}&type=online`, 303);
    }

    // Fallback if udf1 is somehow missing but payment succeeded
    return NextResponse.redirect(`${siteUrl}/order-success?orderId=unknown&type=online`, 303);

  } catch (err: any) {
    console.error('🔴 [API PayU Callback] Error:', err);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${siteUrl}/payment/failure?error=server_error`, 303);
  }
}
