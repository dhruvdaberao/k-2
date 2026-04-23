import { NextResponse } from 'next/server';

type EmailPayload = {
  type: 'order_placed' | 'order_cancelled';
  userEmail: string;
  orderId: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  total?: number;
};

// Reusable email wrapper to ensure consistent branding
const generateEmailLayout = (content: string, showButton: boolean = false, orderId: string = '') => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const invoiceUrl = `${baseUrl}/api/invoice?orderId=${orderId}`;

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5EFE6; padding: 40px 10px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(90, 62, 43, 0.08);">
        
        <!-- Header -->
        <h1 style="text-align: center; color: #5a3e2b; margin-top: 0; font-size: 28px; font-weight: bold; border-bottom: 2px solid #f0e6d2; padding-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">
          Keshvi Crafts
        </h1>

        <!-- Dynamic Content -->
        <div style="color: #2f2a26; line-height: 1.6; font-size: 15px; margin-top: 20px;">
          ${content}
        </div>

        ${showButton && orderId ? `
          <!-- Action Button -->
          <div style="text-align: center; margin: 35px 0 20px;">
            <a href="${invoiceUrl}" style="background-color: #5a3e2b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
              Download Invoice
            </a>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #f0e6d2; margin-top: 30px; padding-top: 20px;">
          <p style="color: #8B5E3C; font-style: italic; font-size: 14px; margin: 0;">
            Thank you for shopping with Keshvi Crafts 💛
          </p>
        </div>

      </div>
    </div>
  `;
};

export async function POST(req: Request) {
  try {
    const body: EmailPayload = await req.json();
    const { type, userEmail, orderId, items = [], total = 0 } = body;

    if (!userEmail || !orderId) {
      console.error('[Email API] Missing userEmail or orderId in request');
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.KeshviCraftsOrders;
    const businessEmail = process.env.BUSINESS_EMAIL;

    if (!apiKey || !businessEmail) {
      console.error('[Email API] Missing KeshviCraftsOrders or BUSINESS_EMAIL in env');
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const adminEmail = businessEmail;
    
    // Formatting the items list clean
    const itemsListHtml = items.length > 0 
      ? `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 0;">
          ${items.map(item => `
            <li style="padding: 10px 0; border-bottom: 1px solid #f5f0e6; display: flex; justify-content: space-between;">
              <span style="font-weight: 500;">${item.name}</span>
              <span style="color: #6a6150; white-space: nowrap; margin-left: 15px;">${item.quantity} × ₹${item.price}</span>
            </li>
          `).join('')}
         </ul>`
      : '';

    // Date generation for the exact time of order processing
    const orderDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    // Reusable Order Details Block
    const orderDetailsBlock = `
      <div style="background-color: #faf5eb; border-radius: 10px; padding: 20px; margin: 25px 0; font-size: 14px;">
        <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> <span style="font-family: monospace; font-size: 15px; color: #5a3e2b;">${orderId}</span></p>
        <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${orderDate}</p>
        <p style="margin: 0 0 10px 0;"><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
        <p style="margin: 0;"><strong>Total Amount:</strong> <span style="font-size: 16px; font-weight: bold; color: #5a3e2b;">₹${total}</span></p>
      </div>
    `;

    let userEmailSubject = '';
    let userEmailHtml = '';
    
    let adminEmailSubject = '';
    let adminEmailHtml = '';

    if (type === 'order_placed') {
      userEmailSubject = '🎉 Your Keshvi Crafts Order is Confirmed!';
      userEmailHtml = generateEmailLayout(`
        <h3 style="color: #2f2a26; font-size: 20px; margin-top: 0;">Yay! Your order is placed.</h3>
        <p>Hi there,</p>
        <p>We're thrilled to confirm your order request. Our artisans are getting everything ready for you!</p>
        ${orderDetailsBlock}
        <h4 style="color: #5a3e2b; margin-bottom: 10px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary</h4>
        ${itemsListHtml}
      `, true, orderId);

      adminEmailSubject = '🛒 New Order Received — Keshvi Crafts';
      adminEmailHtml = generateEmailLayout(`
        <h3 style="color: #2f2a26; font-size: 20px; margin-top: 0;">Action Required: New Order Placed</h3>
        <p><strong>Customer Email:</strong> ${userEmail}</p>
        ${orderDetailsBlock}
        <h4 style="color: #5a3e2b; margin-bottom: 10px; font-size: 16px; text-transform: uppercase;">Purchased Items</h4>
        ${itemsListHtml}
      `, true, orderId);

    } else if (type === 'order_cancelled') {
      userEmailSubject = 'Your Keshvi Crafts Order has been Cancelled';
      userEmailHtml = generateEmailLayout(`
        <h3 style="color: #A33B3B; font-size: 20px; margin-top: 0;">Order Cancelled</h3>
        <p>Hi there,</p>
        <p>Your order <strong>${orderId}</strong> has been cancelled successfully as requested.</p>
        <p>If you have any questions or if this was a mistake, please reply to this email or contact our support.</p>
        ${orderDetailsBlock}
        <h4 style="color: #A33B3B; margin-bottom: 10px; font-size: 16px; text-transform: uppercase;">Cancelled Items</h4>
        ${itemsListHtml}
      `, true, orderId);

      adminEmailSubject = 'Order Cancelled — Keshvi Crafts';
      adminEmailHtml = generateEmailLayout(`
        <h3 style="color: #A33B3B; font-size: 20px; margin-top: 0;">Order Cancellation Notice</h3>
        <p><strong>Customer:</strong> ${userEmail}</p>
        <p>The user has cancelled this order. Please halt any fulfillment processing.</p>
        ${orderDetailsBlock}
        <h4 style="color: #A33B3B; margin-bottom: 10px; font-size: 16px; text-transform: uppercase;">Cancelled Items</h4>
        ${itemsListHtml}
      `, true, orderId);

    } else if (type === 'order_shipped') {
      userEmailSubject = '🚚 Your Keshvi Crafts Order is on the way!';
      userEmailHtml = generateEmailLayout(`
        <h3 style="color: #2f2a26; font-size: 20px; margin-top: 0;">Great news! Order Shipped.</h3>
        <p>Hi there,</p>
        <p>Your beautiful items have been shipped and are on their way to you!</p>
        ${orderDetailsBlock}
      `, true, orderId);

      adminEmailSubject = 'Notice: Order Shipped — Keshvi Crafts';
      adminEmailHtml = generateEmailLayout(`
        <h3 style="color: #2f2a26; font-size: 20px; margin-top: 0;">System Notice: Order Shipped</h3>
        <p><strong>Customer:</strong> ${userEmail}</p>
        <p>Order <strong>${orderId}</strong> was marked as shipped.</p>
        ${orderDetailsBlock}
      `, true, orderId);
      
    } else if (type === 'order_delivered') {
      userEmailSubject = '✅ Your Keshvi Crafts Order has arrived!';
      userEmailHtml = generateEmailLayout(`
        <h3 style="color: #2f2a26; font-size: 20px; margin-top: 0;">Order Delivered</h3>
        <p>Hi there,</p>
        <p>Your order has been officially delivered. We hope you love your new Keshvi Crafts handcrafted items!</p>
        ${orderDetailsBlock}
      `, true, orderId);

      adminEmailSubject = 'Notice: Order Delivered — Keshvi Crafts';
      adminEmailHtml = generateEmailLayout(`
        <h3 style="color: #2f2a26; font-size: 20px; margin-top: 0;">System Notice: Order Delivered</h3>
        <p><strong>Customer:</strong> ${userEmail}</p>
        <p>Order <strong>${orderId}</strong> was marked as successfully delivered.</p>
        ${orderDetailsBlock}
      `, true, orderId);
      
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    // Prepare Brevo API requests
    const sendBrevoEmail = async (subject: string, htmlContent: string, toEmail: string, toName: string) => {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: adminEmail, name: 'Keshvi Crafts' },
          to: [{ email: toEmail, name: toName }],
          subject,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errortxt = await response.text();
        console.error('[Email API] Brevo error:', errortxt);
        throw new Error('Failed to send email via Brevo');
      }
    };

    // Send emails simultaneously covering admin loops explicitly
    await Promise.all([
      sendBrevoEmail(userEmailSubject, userEmailHtml, userEmail, 'Customer'),
      sendBrevoEmail(adminEmailSubject, adminEmailHtml, adminEmail, 'Admin'),
      sendBrevoEmail(adminEmailSubject, adminEmailHtml, 'gaypsyduck@gmail.com', 'Admin Archival')
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email API] Internal error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
