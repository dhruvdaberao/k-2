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
      
      // Clear the user's cart if they have a registered account associated with this order
      const { data: orderData } = await supabase.from("orders").select("user_id, display_id").eq("id", udf1).single();
      if (orderData && orderData.user_id) {
        await supabase.from("cart").delete().eq("user_id", orderData.user_id);
      }
      
      const displayId = orderData?.display_id || udf1;
      return NextResponse.redirect(`${siteUrl}/payment/success?order_id=${displayId}`, 303);
    }

    // Fallback if udf1 is somehow missing but payment succeeded
    return NextResponse.redirect(`${siteUrl}/payment/success?order_id=unknown`, 303);

  } catch (err: any) {
    console.error('🔴 [API PayU Callback] Error:', err);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${siteUrl}/payment/failure?error=server_error`, 303);
  }
}
