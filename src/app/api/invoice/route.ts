import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  console.log('[Invoice API] Hit:', req.url);
  try {
    const { searchParams } = new URL(req.url);
    const dParam = searchParams.get('d');
    const orderId = searchParams.get('orderId');

    let orderData: any = null;

    // Phase 1: Try to decode from 'd' parameter (Stateless)
    if (dParam) {
      try {
        console.log('[Invoice API] Attempting to decode d-param...');
        const decoded = decodeURIComponent(Buffer.from(dParam, 'base64').toString('utf-8'));
        orderData = JSON.parse(decoded);
        console.log("[Invoice API] Successfully parsed stateless data for:", orderData.o);
      } catch (e) {
        console.error("[Invoice API] Failed to parse 'd' param:", e);
      }
    }

    // Phase 2: Fallback to orderId (Requires DB fetch)
    if (!orderData && orderId) {
      console.log("[Invoice API] Fallback to DB fetch for:", orderId);
      const supabase = createRouteHandlerClient({ cookies });
      
      // Cleanup orderId from any quotes or spaces
      const cleanId = orderId.trim().replace(/['"]/g, '');

      let { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .or(`display_id.eq.${cleanId},id.eq.${cleanId}`)
        .maybeSingle();

      if (error) {
        console.error('[Invoice API] Supabase fetch error (OR):', error);
      }

      // Final fallback: try separate equality checks if OR failed or returned nothing
      if (!order) {
        console.log("[Invoice API] OR query yielded nothing, trying exact display_id match...");
        const { data: dMatch } = await supabase.from('orders').select('*').eq('display_id', cleanId).maybeSingle();
        order = dMatch;
      }

      if (order) {
        console.log('[Invoice API] Successfully found order:', order.id);
        // ... mapping logic
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch(e) {}

        let addr: any = order.delivery_address || (typeof order.address === 'string' ? { address_line: order.address } : order.address) || {};

        orderData = {
          o: order.display_id || order.id,
          c: order.created_at,
          s: Number(order.total_amount || 0) + (Number(order.discount_amount || 0)) - (Number(order.shipping_charge || 0)),
          d: Number(order.discount_amount || 0),
          sh: Number(order.shipping_charge || 0),
          sd: 0, 
          t: Number(order.total_amount || 0),
          pm: order.payment_method,
          u: {
            n: addr.full_name || addr.name || "Customer",
            p: addr.phone || "",
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
      return new Response("Invoice data not found. Please provide 'd' or 'orderId'.", { status: 400 });
    }

    // --- Generate PDF with jsPDF ---
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const accentColor = [216, 195, 165]; // #D8C3A5

    // 1. BRAND HEADER
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, width, 15, 'F');
    
    // Add Logo (Attempt to fetch from public/logo.png on the same host)
    try {
      const host = orderData.h || (typeof window !== 'undefined' ? window.location.origin : '');
      const logoUrl = host ? `${host}/logo.png` : '';
      if (logoUrl) {
         // In server-side Next.js, we might need to read from filesystem or fetch
         // Since we are in an API route, let's try reading the file from the local disk if possible
         // Or just use the text-fallback if image fails
      }
    } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(90, 62, 43); // #5a3e2b
    doc.text("Keshvi Crafts", 20, 35);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Handmade with Love", 20, 42);

    doc.setFontSize(20);
    doc.setTextColor(47, 42, 38); // #2f2a26
    doc.text("INVOICE", width - 20, 35, { align: "right" });

    // 2. ORDER DETAILS
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text(`INVOICE NO: ${orderData.o}`, width - 20, 45, { align: "right" });
    
    const dateStr = new Date(orderData.c).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.text(`DATE: ${dateStr}`, width - 20, 50, { align: "right" });
    doc.text(`PAYMENT: ${(orderData.pm || 'COD').toUpperCase()}`, width - 20, 55, { align: "right" });

    // 3. BILL TO & SHIP TO
    doc.setDrawColor(230);
    doc.line(20, 65, width - 20, 65);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("BILL TO:", 20, 75);
    
    doc.setTextColor(47, 42, 38);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(orderData.u?.n || "Customer", 20, 82);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(orderData.u?.p || "", 20, 87);
    
    const address = `${orderData.u?.a || ''}, ${orderData.u?.c || ''} - ${orderData.u?.z || ''}`;
    const splitAddress = doc.splitTextToSize(address, 70);
    doc.text(splitAddress, 20, 92);

    // 4. ITEMS TABLE
    const tableData = (orderData.i || []).map((it: any) => [
      it.n || "Item",
      it.q || 1,
      `Rs. ${Number(it.p || 0).toLocaleString('en-IN')}`,
      `Rs. ${(Number(it.q || 1) * Number(it.p || 0)).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: 110,
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
