import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, userEmail, orderId, items = [], total = 0 } = body;

    const apiKey = process.env.KeshviCraftsOrders;
    const businessEmail = process.env.BUSINESS_EMAIL;

    if (!apiKey || !businessEmail) {
      console.error('[Email API] Missing keys:', { hasKey: !!apiKey, hasEmail: !!businessEmail });
      return NextResponse.json({ success: false, error: 'Email configuration missing' }, { status: 500 });
    }

    // Formatting items
    const itemsHtml = items.map(item => `
      <li>${item.name} (x${item.quantity}) - ₹${item.price}</li>
    `).join('');

    const emailHtml = `
      <h1>Order Confirmation: ${orderId}</h1>
      <p>Thank you for your order!</p>
      <ul>${itemsHtml}</ul>
      <p>Total: ₹${total}</p>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: businessEmail, name: 'Keshvi Crafts' },
        to: [{ email: userEmail }, { email: businessEmail }],
        subject: `Order Confirmed: ${orderId}`,
        htmlContent: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email API] Brevo error:', error);
      return NextResponse.json({ success: false, error: 'Brevo failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
