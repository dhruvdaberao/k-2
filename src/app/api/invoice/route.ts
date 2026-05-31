import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  console.log('[Invoice API] Hit:', req.url);
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');
    
    if (!orderId) {
      return new Response("Missing orderId", { status: 400 });
    }

    let orderData: any = null;

    if (orderId) {
      console.log("[Invoice API] Fetching DB for order:", orderId);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false }
      });
      
      // Cleanup orderId from any quotes or spaces
      const cleanId = orderId.trim().replace(/['"]/g, '');

      let { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .or(`display_id.eq.${cleanId},id.eq.${cleanId}`)
        .maybeSingle();

      if (error) {
        console.error('[Invoice API] Supabase fetch error (OR):', error);
      }

      // Final fallback: try separate equality checks if OR failed or returned nothing
      if (!order) {
        console.log("[Invoice API] OR query yielded nothing, trying exact display_id match...");
        const { data: dMatch } = await supabaseAdmin.from('orders').select('*, order_items(*)').eq('display_id', cleanId).maybeSingle();
        order = dMatch;
      }

      if (order) {
        // SECURITY CHECK
        const supabaseAuth = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabaseAuth.auth.getUser();
        
        const isOwner = user && user.id === order.user_id;
        const hasValidToken = token && token === order.access_token;

        if (!isOwner && !hasValidToken) {
          console.warn("[Invoice API] Unauthorized access attempt for:", cleanId);
          return new Response("Unauthorized. Please login or provide a valid access token.", { status: 403 });
        }

        console.log('[Invoice API] Successfully found and authorized order:', order.id);
        
        // Items are in order.order_items now
        let items = order.order_items || [];
        if (items.length === 0) {
           try {
             items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
           } catch(e) {}
        }

        let addr: any = order.delivery_address || (typeof order.address === 'string' ? { address_line: order.address } : order.address) || {};

        const subtotalFromItems = items.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
        const calculatedShipping = subtotalFromItems >= 650 ? 0 : 40;
        const finalShipping = order.shipping_charge !== null && order.shipping_charge !== undefined ? Number(order.shipping_charge) : calculatedShipping;

        orderData = {
          o: order.display_id || order.id,
          c: order.created_at,
          s: subtotalFromItems,
          d: Number(order.discount_amount || 0),
          sh: finalShipping,
          sd: 0, 
          t: Number(order.total_amount || 0),
          pm: order.payment_method || 'COD',
          status: order.status,
          u: {
            n: addr.full_name || addr.name || "Customer",
            p: addr.phone || "",
            e: order.email || addr.email || "",
            a: addr.address_line || addr.street || "",
            c: addr.city || "",
            z: addr.pincode || ""
          },
          i: items.map((it: any) => ({
            n: it.name,
            p: it.price,
            q: it.quantity,
            m: it.image
          }))
        };
      }
    }

    if (!orderData) {
      return new Response("Invoice data not found.", { status: 404 });
    }

    const isOnline = orderData.pm?.toLowerCase() !== 'cod';
    const documentType = isOnline ? 'RECEIPT' : 'INVOICE';

    // --- Generate PDF with jsPDF ---
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const accentColor = [216, 195, 165]; // #D8C3A5

    // 1. BRAND HEADER

    // Embed actual logo from disk
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 18, 20, 35, 35);
    } catch (e) {
      // Fallback to text if logo not found
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(90, 62, 43);
      doc.text('Keshvi Crafts', 20, 35);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Handmade with Love', 20, 42);
    }

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(47, 42, 38); // #2f2a26
    doc.text(documentType, width - 20, 35, { align: "right" });

    // 2. ORDER DETAILS
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text(`${documentType} NO: ${orderData.o}`, width - 20, 45, { align: "right" });
    
    const dateStr = new Date(orderData.c).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.text(`DATE: ${dateStr}`, width - 20, 50, { align: "right" });

    // 3. BILL TO & SHIP TO
    doc.setDrawColor(230);
    doc.line(20, 60, width - 20, 60);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("BILL TO:", 20, 75);
    
    doc.setTextColor(47, 42, 38);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(orderData.u?.n || "Customer", 20, 82);
    
    doc.setFontSize(9);
    doc.text(orderData.u?.p || "", 20, 87);
    
    let currentY = 87;
    if (orderData.u?.e) {
      currentY += 5;
      doc.text(orderData.u?.e, 20, currentY);
    }
    
    const address = `${orderData.u?.a || ''}, ${orderData.u?.c || ''} - ${orderData.u?.z || ''}`;
    const splitAddress = doc.splitTextToSize(address, 85); // Increased width slightly for better flow
    currentY += 5;
    doc.text(splitAddress, 20, currentY);
    
    // Dynamically calculate the next starting position based on address length
    // Each line in splitAddress is approx 5 units high
    const addressBottomY = currentY + (splitAddress.length * 5);
    const tableStartY = Math.max(addressBottomY + 15, 105);

    // 4. ITEMS TABLE
    const tableData = (orderData.i || []).map((it: any) => [
      it.n || "Item",
      it.q || 1,
      `Rs. ${Number(it.p || 0).toLocaleString('en-IN')}`,
      `Rs. ${(Number(it.q || 1) * Number(it.p || 0)).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Product Description', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [90, 62, 43], // #5a3e2b
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 }
      },
      styles: { fontSize: 9, cellPadding: 5 }
    });

    // 5. SUMMARY
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if there's enough space for the summary and payment section (approx 75 units needed)
    // -30 is the footer area limit
    if (finalY + 75 > pageHeight - 30) {
      doc.addPage();
      finalY = 20; // Reset Y position on new page
    }

    const summaryRightX = width - 20;
    const summaryLeftX = width - 80;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    
    doc.text("Subtotal:", summaryLeftX, finalY);
    doc.text(`Rs. ${Number(orderData.s || 0).toLocaleString('en-IN')}`, summaryRightX, finalY, { align: "right" });
    
    finalY += 7;
    doc.text("Shipping:", summaryLeftX, finalY);
    doc.text(`Rs. ${Number(orderData.sh || 0).toLocaleString('en-IN')}`, summaryRightX, finalY, { align: "right" });
    
    if (orderData.d > 0) {
      finalY += 7;
      doc.setTextColor(194, 65, 12); // #C2410C
      doc.text(`Discount (${orderData.dp || 0}%):`, summaryLeftX, finalY);
      doc.text(`-Rs. ${Number(orderData.d || 0).toLocaleString('en-IN')}`, summaryRightX, finalY, { align: "right" });
    }

    finalY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(90, 62, 43);
    doc.text("Grand Total:", summaryLeftX, finalY);
    doc.text(`Rs. ${Number(orderData.t || 0).toLocaleString('en-IN')}`, summaryRightX, finalY, { align: "right" });

    // 5.5 PAYMENT MODE & STATUS SECTION
    finalY += 18;
    doc.setDrawColor(230);
    doc.line(20, finalY - 4, width - 20, finalY - 4);

    const paymentModeLabel = orderData.pm?.toLowerCase() === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment';
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Payment Mode: ${paymentModeLabel}`, 20, finalY + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (isOnline || orderData.status === 'paid') {
      doc.setTextColor(34, 139, 34); // Green
      doc.text('Payment Status: PAID ✓', 20, finalY + 13);
    } else {
      doc.setTextColor(200, 100, 0); // Orange
      doc.text('Payment Status: UNPAID — Collect on Delivery', 20, finalY + 13);
    }

    doc.setDrawColor(230);
    doc.line(20, finalY + 18, width - 20, finalY + 18);

    // 6. FOOTER
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 5, width - 20, footerY - 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(90, 62, 43);
    doc.text("Thank you for shopping with Keshvi Crafts!", width / 2, footerY, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("For any queries, contact us on Instagram: @keshvi_crafts  |  WhatsApp: +91 7507996961", width / 2, footerY + 7, { align: "center" });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-KC-${orderData.o}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (err: any) {
    console.error("[Invoice API] Critical Error:", err);
    return new Response("Error generating invoice: " + err.message, { status: 500 });
  }
}
