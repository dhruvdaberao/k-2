import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📧 [Email API] Received request:", body);

    const { type, email, orderId, trackingLink } = body;
    const apiKey = process.env.KeshviCraftsOrders;
    const businessEmail = process.env.BUSINESS_EMAIL;

    if (!apiKey || !businessEmail) {
      console.error('[Email API] Missing configuration keys');
      return NextResponse.json({ success: false, error: 'Email configuration missing' }, { status: 500 });
    }

    if (!email || !orderId) {
      return NextResponse.json({ success: false, error: 'Email and orderId are required' }, { status: 400 });
    }

    let subject = "";
    let htmlContent = "";

    if (type === "order_shipped") {
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
    } else if (type === "order_delivered") {
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
      // Fallback for other types or basic proxying
      return NextResponse.json({ success: true, message: "Type not handled in new API yet" });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: businessEmail, name: 'Keshvi Crafts' },
        to: [{ email: email }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("📧 [Email API] Brevo Error:", errData);
      return NextResponse.json({ success: false, error: "Brevo call failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Email sent" });
  } catch (err: any) {
    console.error("📧 [Email API] Failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
