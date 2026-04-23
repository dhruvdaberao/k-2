import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Draws a clean, professional ecommerce invoice
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return new Response("Missing orderId", { status: 400 });
    }

    // Initialize session-aware Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Fetch order from DB — try display_id first, then id
    // We use a single query with .or() for better performance and reliability
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .or(`display_id.eq."${orderId}",id.eq."${orderId}"`)
      .maybeSingle();

    if (fetchError) {
      console.error('[Invoice API] DB Fetch Error:', fetchError);
      return NextResponse.json({ error: 'Database error', details: fetchError.message }, { status: 500 });
    }

    if (!order) {
      console.error(`[Invoice API] Order not found for ID: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Initialize document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 format
    const { width, height } = page.getSize();
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Standard Colors
    const colorBrown = rgb(0.35, 0.24, 0.17); // #5a3e2b
    const colorBlack = rgb(0.18, 0.16, 0.15); // #2f2a26
    const colorGray = rgb(0.42, 0.45, 0.50); // #6b7280
    const colorLightGray = rgb(0.9, 0.9, 0.9);
    const colorRed = rgb(0.8, 0.1, 0.15);
    const colorWhite = rgb(1, 1, 1);

    // Baseline tracker
    let currentY = height - 50;

    // --- 1. HEADER (Logo / Brand / Order ID) ---
    page.drawText('Keshvi Crafts', { x: 50, y: currentY, size: 28, font: boldFont, color: colorBrown });
    
    // Push invoice label right
    page.drawText('INVOICE', { 
      x: width - 150, 
      y: currentY, 
      size: 24, 
      font: boldFont, 
      color: colorBlack 
    });

    currentY -= 15;
    page.drawText('Handmade with Love', { x: 50, y: currentY, size: 10, font, color: colorGray });
    
    // Order ID logic on right
    page.drawText(`Order ID:`, { x: width - 150, y: currentY, size: 10, font: boldFont, color: colorGray });
    page.drawText(order.display_id || order.id, { x: width - 100, y: currentY, size: 10, font: boldFont, color: colorBlack });

    currentY -= 30;
    
    // --- 8. CANCELLED OUTLINE ---
    if (order.status === 'cancelled') {
        const d = order.updated_at ? new Date(order.updated_at) : new Date();
        const cDate = d.toLocaleDateString('en-IN') + " " + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        // Red Box
        page.drawRectangle({
            x: 50,
            y: currentY - 20,
            width: width - 100,
            height: 30,
            color: rgb(0.98, 0.85, 0.85),
            borderColor: colorRed,
            borderWidth: 1,
        });
        
        page.drawText(`ORDER CANCELLED on ${cDate}`, {
            x: 60,
            y: currentY - 10,
            size: 12,
            font: boldFont,
            color: colorRed,
        });

        currentY -= 40;
    }

    // Line separator
    page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 1, color: colorLightGray });
    currentY -= 25;

    // --- 2. CUSTOMER DETAILS & 3. ORDER DETAILS ---
    // Left Block: Bill To
    page.drawText(`BILL TO:`, { x: 50, y: currentY, size: 10, font: boldFont, color: colorGray });
    
    // Right Block: Order Info
    page.drawText(`ORDER DATE:`, { x: width / 2 + 50, y: currentY, size: 10, font: boldFont, color: colorGray });

    currentY -= 15;
    
    // Extract Address and Parse — prefer delivery_address JSON, fallback to legacy address
    let cName = "Customer";
    let cEmail = "";
    let cPhone = "";
    let cAddressLines: string[] = [];

    if (order.delivery_address && typeof order.delivery_address === 'object') {
      // New structured delivery_address JSON
      const da = order.delivery_address;
      cName = da.full_name || "Customer";
      cPhone = da.phone || "";
      if (da.address_line) cAddressLines.push(da.address_line);
      if (da.city || da.state) cAddressLines.push(`${da.city || ''}${da.state ? ', ' + da.state : ''}`);
      if (da.pincode) cAddressLines.push(`Pincode: ${da.pincode}`);
    } else if (order.address) {
      if (typeof order.address === 'string') {
        cAddressLines = order.address.split('\n');
      } else if (order.address.name) {
        cName = order.address.name;
        cEmail = order.address.email || "";
        cPhone = order.address.phone || "";
        if (order.address.street) cAddressLines.push(order.address.street);
        if (order.address.city) cAddressLines.push(`${order.address.city}, ${order.address.state || ''}`);
        if (order.address.pincode) cAddressLines.push(`Pincode: ${order.address.pincode}`);
      }
    } else {
      cAddressLines.push("No Address provided");
    }

    // Draw Left Name
    page.drawText(cName.replace(/[^\x20-\x7E]/g, ''), { x: 50, y: currentY, size: 12, font: boldFont, color: colorBlack });
    
    // Draw Right Date
    const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    page.drawText(formattedDate, { x: width / 2 + 50, y: currentY, size: 11, font: boldFont, color: colorBlack });

    currentY -= 15;
    
    let leftY = currentY;
    if (cEmail) {
        page.drawText(`Email: ${cEmail.replace(/[^\x20-\x7E]/g, '')}`, { x: 50, y: leftY, size: 10, font, color: colorBlack });
        leftY -= 15;
    }
    if (cPhone) {
        page.drawText(`Phone: ${cPhone.replace(/[^\x20-\x7E]/g, '')}`, { x: 50, y: leftY, size: 10, font, color: colorBlack });
        leftY -= 15;
    }
    
    for (const line of cAddressLines) {
      const cleanLine = line.replace(/[^\x20-\x7E]/g, '');
      if (cleanLine) {
        page.drawText(cleanLine, { x: 50, y: leftY, size: 10, font, color: colorBlack });
        leftY -= 15;
      }
    }

    // Draw Right Info
    let rightY = currentY;
    page.drawText(`PAYMENT METHOD:`, { x: width / 2 + 50, y: rightY, size: 10, font: boldFont, color: colorGray });
    rightY -= 15;
    page.drawText(String(order.payment_method || 'COD').toUpperCase(), { x: width / 2 + 50, y: rightY, size: 11, font: boldFont, color: colorBlack });

    rightY -= 20;
    page.drawText(`PAYMENT STATUS:`, { x: width / 2 + 50, y: rightY, size: 10, font: boldFont, color: colorGray });
    rightY -= 15;
    page.drawText(String(order.payment_status || 'Pending').toUpperCase(), { x: width / 2 + 50, y: rightY, size: 11, font: boldFont, color: colorBlack });

    currentY = Math.min(leftY, rightY) - 30;

    // --- 4. ITEMS TABLE ---
    // Table Header
    page.drawRectangle({
        x: 50,
        y: currentY - 15,
        width: width - 100,
        height: 25,
        color: colorBrown,
    });
    
    page.drawText(`PRODUCT DESCRIPTION`, { x: 60, y: currentY - 8, size: 9, font: boldFont, color: colorWhite });
    page.drawText(`QTY`, { x: Math.round(width * 0.65), y: currentY - 8, size: 9, font: boldFont, color: colorWhite });
    page.drawText(`PRICE`, { x: Math.round(width * 0.75), y: currentY - 8, size: 9, font: boldFont, color: colorWhite });
    page.drawText(`TOTAL`, { x: Math.round(width * 0.88), y: currentY - 8, size: 9, font: boldFont, color: colorWhite });

    currentY -= 35;

    // Table Content
    let subtotal = 0;
    let itemsArray = order.items || [];
    if (typeof order.items === 'string') {
      try { itemsArray = JSON.parse(order.items); } catch(e){}
    }
    
    for (const item of itemsArray) {
      const cleanName = String(item.name || 'Item').replace(/[^\x20-\x7E]/g, '');
      const itemName = cleanName.length > 50 ? cleanName.substring(0, 48) + '...' : cleanName;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const amt = qty * price;
      subtotal += amt;

      page.drawText(itemName, { x: 60, y: currentY, size: 10, font, color: colorBlack });
      page.drawText(`${qty}`, { x: Math.round(width * 0.65), y: currentY, size: 10, font, color: colorBlack });
      page.drawText(`₹ ${price.toLocaleString('en-IN')}`, { x: Math.round(width * 0.75), y: currentY, size: 10, font, color: colorBlack });
      page.drawText(`₹ ${amt.toLocaleString('en-IN')}`, { x: Math.round(width * 0.88), y: currentY, size: 10, font, color: colorBlack });
      
      currentY -= 20;
    }

    currentY -= 5;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 1, color: colorLightGray });
    currentY -= 25;

    // --- 5. SUMMARY ---
    const finalTotal = order.total_amount || subtotal;
    const shipping = finalTotal - subtotal;
    
    const summaryXLeft = Math.round(width * 0.65);
    const summaryXRight = Math.round(width * 0.88);

    page.drawText(`Subtotal`, { x: summaryXLeft, y: currentY, size: 10, font, color: colorGray });
    page.drawText(`₹ ${subtotal.toLocaleString('en-IN')}`, { x: summaryXRight, y: currentY, size: 10, font, color: colorBlack });
    
    currentY -= 20;
    page.drawText(`Shipping`, { x: summaryXLeft, y: currentY, size: 10, font, color: colorGray });
    page.drawText(`₹ ${Math.max(shipping, 0).toLocaleString('en-IN')}`, { x: summaryXRight, y: currentY, size: 10, font, color: colorBlack });
    
    currentY -= 20;
    
    page.drawText(`TOTAL`, { x: summaryXLeft, y: currentY, size: 14, font: boldFont, color: colorBrown });
    page.drawText(`₹ ${finalTotal.toLocaleString('en-IN')}`, { x: summaryXRight, y: currentY, size: 14, font: boldFont, color: colorBlack });

    // --- 6. FOOTER ---
    page.drawText(`Thank you for shopping with Keshvi Crafts!`, {
      x: 50,
      y: 65,
      size: 11,
      font: boldFont,
      color: colorBrown,
    });

    page.drawText(`For queries regarding order processing, refunds or any concerns:`, {
      x: 50,
      y: 50,
      size: 9,
      font,
      color: colorGray,
    });
    
    page.drawText(`Instagram: @keshvi_crafts  |  WhatsApp: +91 7507996961`, {
      x: 50,
      y: 37,
      size: 9,
      font: boldFont,
      color: colorBrown,
    });

    // Save PDF layout
    const pdfBytes = await pdfDoc.save();

    // Create a precise standard application/pdf binary response
    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-KC-${String(order.display_id || orderId).replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[Invoice API] Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice', details: error.message }, { status: 500 });
  }
}
