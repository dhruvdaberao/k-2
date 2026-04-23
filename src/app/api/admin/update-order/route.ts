import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('🔄 [Admin Update] API hit');
  
  try {
    const body = await req.json();
    const { orderId, newStatus, trackingLink, adminEmail } = body;

    console.log(`🔄 [Admin Update] Order: ${orderId}, Status: ${newStatus}, Admin: ${adminEmail}`);

    // Basic validation
    if (!orderId || !newStatus) {
      return NextResponse.json({ success: false, error: 'orderId and newStatus required' }, { status: 400 });
    }

    // Simple admin check
    if (adminEmail !== 'keshvicrafts@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Service-role client — bypasses ALL RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      console.error('🔴 [Admin Update] SUPABASE_SERVICE_ROLE_KEY is missing!');
      return NextResponse.json({ success: false, error: 'Server config error: service key missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Fetch existing order to get current delivery_address
    const { data: existingOrder, error: fetchOrderError } = await supabase
      .from('orders')
      .select('delivery_address')
      .eq('id', orderId)
      .single();

    if (fetchOrderError) {
      console.error('🔴 [Admin Update] Could not fetch existing order:', fetchOrderError);
      return NextResponse.json({ success: false, error: 'Could not find order' }, { status: 404 });
    }

    const currentAddress = typeof existingOrder?.delivery_address === 'string'
      ? JSON.parse(existingOrder.delivery_address)
      : (existingOrder?.delivery_address || {});

    // 2. Build update payload (Using only columns that exist in the DB)
    const updatePayload: Record<string, any> = {
      status: newStatus,
      delivery_address: {
        ...currentAddress,
        tracking_link: trackingLink || currentAddress.tracking_link || ""
      }
    };

    // If cancelling, we can also update cancelled_at since that column exists
    if (newStatus === 'cancelled') {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    // 3. Update order in DB
    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateError) {
      console.error('🔴 [Admin Update] DB update failed:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    console.log(`✅ [Admin Update] DB updated: ${orderId} -> ${newStatus}`);

    // 3. Fetch order for email
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('🔴 [Admin Update] Fetch for email failed:', fetchError);
      return NextResponse.json({ success: true, emailSent: false, message: 'Updated but email fetch failed' });
    }

    // 4. Send email
    const apiKey = process.env.KeshviCraftsOrders;
    const businessEmail = process.env.BUSINESS_EMAIL;

    if (!apiKey || !businessEmail) {
      return NextResponse.json({ success: true, emailSent: false, message: 'Updated, email config missing' });
    }

    const customerEmail = order.email || order.delivery_address?.email;
    const customerName = order.delivery_address?.full_name || 'Customer';
    const displayId = order.display_id || orderId;

    let subject = '';
    let htmlContent = '';

    if (newStatus === 'shipped') {
      subject = `Your Order Has Been Shipped 🚚 | #${displayId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Your Order is on its Way! 🚚</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>Great news! Your order <strong>#${displayId}</strong> has been shipped.</p>
            ${trackingLink ? `
            <div style="margin: 24px 0; padding: 20px; background-color: #FDFBF7; border-radius: 8px; border: 1px dashed #5A3E2B;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B6B6B;">📦 Track your order:</p>
              <a href="${trackingLink}" style="color: #5A3E2B; font-weight: bold; text-decoration: underline; word-break: break-all;">${trackingLink}</a>
            </div>` : ''}
            <p>Thank you for shopping with <strong>Keshvi Crafts</strong>!</p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Handmade with Love
          </div>
        </div>`;
    } else if (newStatus === 'delivered') {
      subject = `Your Order Has Been Delivered 🎉 | #${displayId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Order Delivered! 🎉</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>Your order <strong>#${displayId}</strong> has been delivered!</p>
            <p>We hope you love your Keshvi Crafts products. Feel free to reach out on Instagram or WhatsApp.</p>
            <p>Thank you ❤️</p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Handmade with Love
          </div>
        </div>`;
    } else if (newStatus === 'cancelled') {
      subject = `Order Cancelled 🛑 | #${displayId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #C62828; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Order Cancelled 🛑</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>Your order <strong>#${displayId}</strong> has been cancelled.</p>
            <p>If this was a mistake or you have any questions, please contact us on Instagram or WhatsApp.</p>
            <p>Thank you,</p>
            <p><strong>Keshvi Crafts</strong></p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Handmade with Love
          </div>
        </div>`;
    }

    // Send email for shipped/delivered/cancelled
    if (subject && htmlContent && customerEmail) {
      try {
        // Define Contents for Owner (Neha)
        let ownerSubject = "";
        let ownerHtml = "";

        if (newStatus === 'shipped') {
          ownerSubject = `Order Successfully Shipped! 🚚 | #${displayId}`;
          ownerHtml = `
            <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">Order Shipped! 🚚</h1>
              </div>
              <div style="padding: 24px;">
                <p>Hello <strong>Neha</strong>,</p>
                <p>You have successfully marked order <strong>#${displayId}</strong> as shipped for <strong>${customerName}</strong>.</p>
                ${trackingLink ? `<p><strong>Tracking Link:</strong> <a href="${trackingLink}">${trackingLink}</a></p>` : ''}
                <p>The customer has been notified.</p>
              </div>
              <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
                &copy; 2024 Keshvi Crafts | Business Notification
              </div>
            </div>`;
        } else if (newStatus === 'delivered') {
          ownerSubject = `Order Successfully Delivered! 🎉 | #${displayId}`;
          ownerHtml = `
            <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">Order Delivered! 🎉</h1>
              </div>
              <div style="padding: 24px;">
                <p>Hello <strong>Neha</strong>,</p>
                <p>Order <strong>#${displayId}</strong> for <strong>${customerName}</strong> has been marked as successfully delivered.</p>
                <p>The customer has been notified and thanked.</p>
              </div>
              <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
                &copy; 2024 Keshvi Crafts | Business Notification
              </div>
            </div>`;
        } else if (newStatus === 'cancelled') {
          ownerSubject = `Order Cancelled 🛑 | #${displayId}`;
          ownerHtml = `
            <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #C62828; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">Order Cancelled 🛑</h1>
              </div>
              <div style="padding: 24px;">
                <p>Hello <strong>Neha</strong>,</p>
                <p>Order <strong>#${displayId}</strong> for <strong>${customerName}</strong> has been marked as cancelled.</p>
                <p>The customer has been notified.</p>
              </div>
              <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
                &copy; 2024 Keshvi Crafts | Business Notification
              </div>
            </div>`;
        }

        // Helper to send via Brevo
        const sendBrevoEmail = async (toEmail: string, sub: string, html: string) => {
          return fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { email: businessEmail, name: 'Keshvi Crafts' },
              to: [{ email: toEmail }],
              subject: sub,
              htmlContent: html,
            }),
          });
        };

        // 1. Send to Customer
        console.log(`📧 [Admin Update] Sending Customer Email to: ${customerEmail}`);
        const customerRes = await sendBrevoEmail(customerEmail, subject, htmlContent);
        if (!customerRes.ok) {
          console.error('🔴 [Admin Update] Customer Email failed:', await customerRes.text());
        }

        // 2. Send to Owner (Neha)
        if (ownerHtml) {
          console.log(`📧 [Admin Update] Sending Owner Email to: ${businessEmail}`);
          const ownerRes = await sendBrevoEmail(businessEmail, ownerSubject, ownerHtml);
          if (!ownerRes.ok) {
            console.error('🔴 [Admin Update] Owner Email failed:', await ownerRes.text());
          }
        }

        return NextResponse.json({ success: true, emailSent: true });
      } catch (emailErr) {
        console.error('🔴 [Admin Update] Email error:', emailErr);
        return NextResponse.json({ success: true, emailSent: false });
      }
    }

    return NextResponse.json({ success: true, emailSent: false });
  } catch (err: any) {
    console.error('🔴 [Admin Update] Critical error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
