import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📧 [Email API] Received request:", body);

    const { type, email, userEmail, orderId, trackingLink, customerName, total, items, paymentMethod, invoiceUrl } = body;
    
    // Support both 'email' and 'userEmail'
    const targetEmail = email || userEmail;
    
    const apiKey = process.env.KeshviCraftsOrders;
    const businessEmail = process.env.BUSINESS_EMAIL;

    if (!apiKey || !businessEmail) {
      console.error('[Email API] Missing configuration keys');
      return NextResponse.json({ success: false, error: 'Email configuration missing' }, { status: 500 });
    }

    if (!targetEmail || !orderId) {
      return NextResponse.json({ success: false, error: 'Target email and orderId are required' }, { status: 400 });
    }

    let subject = "";
    let htmlContent = "";

    if (type === "order_placed" || type === "placed") {
      subject = `Order Confirmed! 🎉 | #${orderId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Thank You for Your Order!</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello ${customerName || 'Customer'},</p>
            <p>Your order <strong>#${orderId}</strong> has been successfully placed and is now being processed.</p>
            
            <div style="margin: 24px 0; padding: 20px; background-color: #FDFBF7; border-radius: 8px; border: 1px solid #E6DCCF;">
              <h3 style="margin-top: 0; color: #5A3E2B;">Order Summary</h3>
              <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${total}</p>
              <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
              <div style="margin-top: 12px;">
                <p style="margin-bottom: 4px; font-weight: bold;">Items:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${items?.map((item: any) => `<li>${item.name} x${item.quantity}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invoiceUrl}" style="background-color: #5A3E2B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Invoice</a>
            </div>

            <p>We'll notify you as soon as your handmade goodies are shipped!</p>
            <p>Warmly,<br/><strong>Keshvi Crafts</strong></p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Handmade with Love
          </div>
        </div>
      `;
    } else if (type === "order_shipped" || type === "shipped") {
      subject = `Your Order Has Been Shipped 🚚 | #${orderId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Your Order is on its Way!</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello,</p>
            <p>Great news! Your order <strong>#${orderId}</strong> has been shipped and is heading your way.</p>
            <div style="margin: 24px 0; padding: 20px; background-color: #FDFBF7; border-radius: 8px; border: 1px dashed #5A3E2B;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B6B6B;">Tracking Link:</p>
              <a href="${trackingLink}" style="color: #5A3E2B; font-weight: bold; text-decoration: underline; word-break: break-all;">${trackingLink}</a>
            </div>
            <p>You can use the link above to track your package in real-time.</p>
            <p>Thank you for shopping with <strong>Keshvi Crafts</strong>!</p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Handmade with Love
          </div>
        </div>
      `;
    } else if (type === "order_delivered" || type === "delivered") {
      subject = `Your Order Has Been Delivered 🎉 | #${orderId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Order Delivered!</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello,</p>
            <p>Your order <strong>#${orderId}</strong> has been successfully delivered. We hope you love your new Keshvi Crafts products!</p>
            <p>If you have any feedback or want to share your experience, feel free to reach out to us on Instagram or WhatsApp.</p>
            <p>Thank you for being a part of our journey ❤️</p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Handmade with Love
          </div>
        </div>
      `;
    } else {
      return NextResponse.json({ success: true, message: "Type not handled" });
    }

    // Define contents for Customer
    const customerSubject = subject;
    const customerHtml = htmlContent;

    // Define contents for Owner (Neha)
    let ownerSubject = "";
    let ownerHtml = "";

    if (type === "order_placed" || type === "placed") {
      ownerSubject = `New Order Received! 🛍️ | #${orderId}`;
      ownerHtml = `
        <div style="font-family: Arial, sans-serif; color: #2D2D2D; max-width: 600px; margin: 0 auto; border: 1px solid #E6DCCF; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #5A3E2B; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">New Order Received! 🛍️</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>Neha</strong>,</p>
            <p>You have received a new order from <strong>${customerName || 'a customer'}</strong> (${targetEmail}).</p>
            
            <div style="margin: 24px 0; padding: 20px; background-color: #FDFBF7; border-radius: 8px; border: 1px solid #E6DCCF;">
              <h3 style="margin-top: 0; color: #5A3E2B;">Order Details (#${orderId})</h3>
              <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${total}</p>
              <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
              <div style="margin-top: 12px;">
                <p style="margin-bottom: 4px; font-weight: bold;">Items:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${items?.map((item: any) => `<li>${item.name} x${item.quantity}</li>`).join('')}
                </ul>
              </div>
            </div>

            <p>Please log in to the admin dashboard to manage this order.</p>
          </div>
          <div style="background-color: #FDFBF7; padding: 16px; text-align: center; font-size: 12px; color: #6B6B6B; border-top: 1px solid #E6DCCF;">
            &copy; 2024 Keshvi Crafts | Business Notification
          </div>
        </div>
      `;
    }

    // Helper function to send email via Brevo
    const sendBrevoEmail = async (toEmail: string, sub: string, html: string) => {
      return fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: businessEmail, name: 'Keshvi Crafts' },
          to: [{ email: toEmail }],
          subject: sub,
          htmlContent: html,
        }),
      });
    };

    // 1. Send to Customer
    const customerRes = await sendBrevoEmail(targetEmail, customerSubject, customerHtml);
    if (!customerRes.ok) {
      console.error("📧 [Email API] Customer Email Failed:", await customerRes.json());
    }

    // 2. Send to Owner (if notification type matches)
    const notifyOwnerTypes = ["order_placed", "placed"];
    if (notifyOwnerTypes.includes(type) && ownerHtml) {
      const ownerRes = await sendBrevoEmail(businessEmail, ownerSubject, ownerHtml);
      if (!ownerRes.ok) {
        console.error("📧 [Email API] Owner Email Failed:", await ownerRes.json());
      }
    }

    return NextResponse.json({ success: true, message: "Emails processed" });
  } catch (err: any) {
    console.error("📧 [Email API] Failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
