import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('>>> [Email API: Mail] Received request <<<');
  try {
    const rawBody = await req.text();
    console.log('>>> [Email API: Mail] Raw Body:', rawBody);
    
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('>>> [Email API: Mail] JSON Parse Error:', e);
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const { 
      userEmail, 
      orderId, 
      items = [], 
      total = 0, 
      paymentMethod = 'COD', 
      invoiceUrl = '', 
      customerName = 'Valued Customer' 
    } = body;

    const apiKey = process.env.KeshviCraftsOrders;
    const businessEmail = process.env.BUSINESS_EMAIL;

    if (!apiKey || !businessEmail) {
      console.error('[Email API: Mail] Missing configuration keys');
      return NextResponse.json({ success: false, error: 'Email configuration missing' }, { status: 500 });
    }

    if (!userEmail) {
      console.error('[Email API: Mail] Missing userEmail');
      return NextResponse.json({ success: false, error: 'userEmail is required' }, { status: 400 });
    }

    // Defensive check for items
    const safeItems = Array.isArray(items) ? items : [];

    const itemsHtml = safeItems.map((item: any) => `
      <tr style="border-bottom: 1px solid #e6ded4;">
        <td style="padding: 12px 0; color: #5a3e2b;">${item.name || 'Unknown Item'}</td>
        <td style="padding: 12px 0; color: #5a3e2b; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 12px 0; color: #5a3e2b; text-align: right;">₹${item.price || 0}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #2f2a26; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e6ded4; border-radius: 12px; overflow: hidden; }
          .header { background-color: #5a3e2b; color: #ffffff; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f7f3ed; color: #8c7e6a; padding: 20px; text-align: center; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #5a3e2b; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .total-row { font-size: 18px; font-weight: bold; color: #5a3e2b; border-top: 2px solid #5a3e2b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 24px;">Order Confirmed!</h1>
            <p style="margin:5px 0 0 0; opacity: 0.8;">Order #${orderId}</p>
          </div>
          <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Thank you for choosing <strong>Keshvi Crafts</strong>! Your order has been placed successfully and is being processed.</p>
            
            <h3 style="color: #5a3e2b; border-bottom: 2px solid #f7f3ed; padding-bottom: 8px;">Order Details</h3>
            <table class="summary-table">
              <thead>
                <tr style="text-align: left; color: #8c7e6a; font-size: 12px; text-transform: uppercase;">
                  <th style="padding-bottom: 8px;">Item</th>
                  <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr style="color: #8c7e6a; font-size: 14px;">
                  <td colspan="2" style="padding-top: 20px;">Subtotal</td>
                  <td style="padding-top: 20px; text-align: right;">₹${body.subtotal || total}</td>
                </tr>
                <tr style="color: #8c7e6a; font-size: 14px;">
                  <td colspan="2" style="padding: 5px 0;">Shipping</td>
                  <td style="padding: 5px 0; text-align: right;">₹${body.shipping || 0}</td>
                </tr>
                ${body.discount > 0 ? `
                <tr style="color: #C2410C; font-size: 14px;">
                  <td colspan="2" style="padding: 5px 0;">Discount</td>
                  <td style="padding: 5px 0; text-align: right;">-₹${body.discount}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="2" style="padding-top: 15px;">Total Amount</td>
                  <td style="padding-top: 15px; text-align: right;">₹${total}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top: 25px; padding: 15px; background-color: #fcfaf7; border-radius: 8px; border-left: 4px solid #5a3e2b;">
              <p style="margin: 0; font-size: 14px; color: #8c7e6a;">Payment Method</p>
              <p style="margin: 4px 0 0 0; font-weight: bold; color: #5a3e2b;">${paymentMethod}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${invoiceUrl}" class="button">Download Invoice PDF</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Keshvi Crafts. All rights reserved.</p>
            <p>If you have any questions, reply to this email or contact us at ${businessEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('>>> [Email API: Mail] Calling Brevo for:', userEmail);
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: businessEmail, name: 'Keshvi Crafts' },
        to: [{ email: userEmail }, { email: businessEmail }],
        subject: `Order Confirmed: ${orderId} | Keshvi Crafts`,
        htmlContent: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('[Email API: Mail] Brevo error:', errorMsg);
      return NextResponse.json({ success: false, error: 'Brevo transmission failed' }, { status: 500 });
    }

    console.log('>>> [Email API: Mail] Successfully sent! <<<');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Email API: Mail] Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
