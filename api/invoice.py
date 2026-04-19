import base64
import json
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

from flask import Flask, request, send_file
from flask_cors import CORS
from reportlab.lib import colors, utils
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

app = Flask(__name__)
CORS(app)

ACCENT = colors.HexColor("#D8C3A5")
TEXT = colors.HexColor("#2E2E2E")
LIGHT_BG = colors.HexColor("#FDFBF7")


def _get_image(url_or_path: str, width: float = None) -> Image | None:
    """Load image from URL or local path and scale maintaining aspect ratio."""
    try:
        if url_or_path.startswith("http"):
            request_obj = Request(url_or_path, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(request_obj, timeout=5) as response:
                img_data = BytesIO(response.read())
        else:
            img_data = url_or_path
            if not Path(url_or_path).exists():
                return None

        # Calculate aspect ratio
        img_reader = utils.ImageReader(img_data)
        iw, ih = img_reader.getSize()
        aspect = ih / float(iw)
        
        if width:
            height = width * aspect
            return Image(img_data, width=width, height=height)
        return Image(img_data)
    except Exception:
        return None


def _currency(value: Any) -> str:
    return f"Rs. {float(value or 0):.2f}"


@app.route("/api/invoice")
def generate_invoice():
    encoded_data = request.args.get("d", "")
    if not encoded_data:
        return "Missing order data", 400

    try:
        data = json.loads(base64.b64decode(encoded_data).decode("utf-8"))
    except Exception as e:
        return f"Invalid data: {str(e)}", 400

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    style_title = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        alignment=0, # Left-aligned for table cell
        textColor=TEXT
    )
    
    style_label = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=TEXT
    )
    
    style_value = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=TEXT
    )

    style_footer = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        alignment=1,
        textColor=colors.HexColor("#666666")
    )

    elements = []

    # --- 1. HEADER SECTION (Heading Left, Logo Right) ---
    doc_type = request.args.get("t", "invoice").lower()
    if doc_type == "order_details":
        heading_text = "ORDER DETAILS"
    elif doc_type == "receipt":
        heading_text = "RECEIPT"
    else:
        heading_text = "INVOICE"
    
    # Load Logo
    logo_img = None
    origin = data.get("h", "")
    if origin:
        logo_url = f"{origin.rstrip('/')}/uploads/hero/logo.png"
        logo_img = _get_image(logo_url, width=35 * mm) # Balanced size
    
    if not logo_img:
        logo_paths = ["public/uploads/hero/logo.png", "uploads/hero/logo.png"]
        for p in logo_paths:
            logo_img = _get_image(p, width=35 * mm)
            if logo_img: break

    # Header Table: [ Heading | Logo ]
    header_data = [[
        Paragraph(f"<font size='22'><b>{heading_text}</b></font>", style_title),
        logo_img if logo_img else ""
    ]]
    
    header_table = Table(header_data, colWidths=[110 * mm, 60 * mm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), # Exact center alignment
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    
    # Official Line
    pdf_line = Table([[""]], colWidths=[170 * mm])
    pdf_line.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 2, ACCENT)]))
    elements.append(pdf_line)
    elements.append(Spacer(1, 10 * mm))

    # --- 2. ORDER INFO ---
    order_id = data.get('o', 'N/A')
    date_str = data.get('c', datetime.now(timezone.utc).isoformat())
    payment_mode = data.get('pm', 'cod').upper()
    payment_label = "Cash on Delivery" if payment_mode == 'COD' else "Online / Prepaid"

    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        formatted_date = dt.strftime('%d %b %Y, %I:%M %p')
    except:
        formatted_date = date_str

    info_data = [
        [Paragraph(f"<b>Order ID:</b> {order_id}", style_value), 
         Paragraph(f"<b>Date:</b> {formatted_date}", style_footer)],
        [Paragraph(f"<b>Payment Mode:</b> {payment_label}", style_value), ""]
    ]
    info_table = Table(info_data, colWidths=[100 * mm, 70 * mm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 1), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10 * mm))


    # --- 3. CUSTOMER DETAILS ---
    user = data.get("u", {})
    elements.append(Paragraph("<b>Customer Details</b>", style_label))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"Name: {user.get('n', '-')}", style_value))
    elements.append(Paragraph(f"Phone: {user.get('p', '-')}", style_value))
    addr = f"{user.get('a', '-')}, {user.get('c', '-')}, {user.get('z', '-')}"
    elements.append(Paragraph(f"Address: {addr}", style_value))
    elements.append(Spacer(1, 12 * mm))

    # --- 4. PRODUCT TABLE ---
    headers = ["Product Name", "Qty", "Price", "Total"]
    table_data = [headers]
    
    col_widths = [90 * mm, 12 * mm, 34 * mm, 34 * mm]
    
    for item in data.get("i", []):
        row = [
            Paragraph(item.get("n", ""), style_value),
            item.get("q", 0),
            _currency(item.get("p", 0)),
            _currency(float(item.get("p", 0)) * int(item.get("q", 0)))
        ]
        table_data.append(row)

    invoice_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Table Styling
    invoice_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), TEXT),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        # Alignment
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),    # Header: Name
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),  # Header: Qty
        ('ALIGN', (2, 0), (-1, 0), 'RIGHT'),  # Header: Price/Total
        
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),   # Data: Name
        ('ALIGN', (1, 1), (1, -1), 'CENTER'), # Data: Qty
        ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  # Data: Price
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),  # Data: Total
        
        # Grid/Borders
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        
        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 10 * mm))

    # --- 5. SUMMARY SECTION ---
    # Right-aligned Summary Table
    # Summary Data
    subtotal = data.get("s", 0)
    discount = data.get("d", 0)
    shipping_fee = data.get("sh", 40)
    shipping_discount = data.get("sd", 0)
    discount_pct = data.get("dp", 0)
    final_total = data.get("t", 0)

    summary_data = [
        ["Subtotal", _currency(subtotal)],
        ["Shipping Fee", _currency(shipping_fee)]
    ]
    
    if shipping_discount < 0:
        summary_data.append(["Shipping Discount", f"-{_currency(abs(shipping_discount))}"])
        
    if discount > 0:
        label = f"Order Discount ({discount_pct}%)" if discount_pct else "Order Discount"
        summary_data.append([label, f"-{_currency(discount)}"])
        
    summary_data.append(["Final Amount", _currency(final_total)])
    
    summary_table = Table(summary_data, colWidths=[136 * mm, 34 * mm])
    summary_table.hAlign = 'RIGHT'
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        
        # Border
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        
        # Final Amount Highlighting (Last Row)
        ('BACKGROUND', (0, -1), (1, -1), ACCENT),
        ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
        ('TOPPADDING', (0, -1), (1, -1), 10),
        ('BOTTOMPADDING', (0, -1), (1, -1), 10),
    ]))
    elements.append(summary_table)
    
    elements.append(Spacer(1, 20 * mm))

    # --- 6. FOOTER SECTION ---
    # Using a heart symbol that is safe for standard PDF fonts
    elements.append(Paragraph("Thank you for shopping with Keshvi Crafts <font color='#e63946' size='12'>♥</font>", style_footer))
    elements.append(Paragraph("Support: @keshvi_crafts | WhatsApp: 7507996961", style_footer))

    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    filename_prefix = heading_text.title().replace(" ", "")
    filename = f"{filename_prefix}_{data.get('o', 'KC')}.pdf"
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )


if __name__ == "__main__":
    app.run(debug=True)
