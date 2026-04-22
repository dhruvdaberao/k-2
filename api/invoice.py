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

ACCENT = colors.HexColor("#F5EFE6")  # Light beige
TEXT = colors.HexColor("#2f2a26")    # Dark text
BRAND = colors.HexColor("#5a3e2b")   # Brown headings


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
        alignment=0, # Left-aligned
        textColor=BRAND
    )

    style_subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=11,
        textColor=colors.HexColor("#6b6b6b")
    )
    
    style_label = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=BRAND
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
        fontSize=10,
        alignment=1,
        textColor=BRAND
    )

    style_right = ParagraphStyle(
        "RightAlign",
        parent=style_value,
        alignment=2
    )

    elements = []

    # --- 1. HEADER SECTION ---
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
        logo_img = _get_image(logo_url, width=40 * mm)
    
    if not logo_img:
        base_path = Path(__file__).parent.parent
        logo_paths = [
            base_path / "public" / "uploads" / "hero" / "logo.png",
            base_path / "uploads" / "hero" / "logo.png"
        ]
        for p in logo_paths:
            if p.exists():
                logo_img = _get_image(str(p), width=40 * mm)
                if logo_img: break

    # Header Table: [ Brand Details | Logo ]
    brand_content = [
        Paragraph("<font size='26'><b>Keshvi Crafts</b></font>", style_title),
        Spacer(1, 2 * mm),
        Paragraph("Handmade with Love", style_subtitle),
        Spacer(1, 8 * mm),
        Paragraph(f"<font size='16'><b>{heading_text}</b></font>", style_title)
    ]

    header_data = [[
        brand_content,
        logo_img if logo_img else ""
    ]]
    
    header_table = Table(header_data, colWidths=[110 * mm, 60 * mm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    
    pdf_line = Table([[""]], colWidths=[170 * mm])
    pdf_line.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 1.5, ACCENT)]))
    elements.append(pdf_line)
    elements.append(Spacer(1, 8 * mm))

    # --- 2. ORDER INFO ---
    order_id = data.get('o', 'N/A')
    date_str = data.get('c', datetime.now(timezone.utc).isoformat())
    payment_mode = data.get('pm', 'cod').upper()
    payment_label = "Cash on Delivery (COD)" if payment_mode == 'COD' else "Online / Prepaid"
    payment_status = "Pending" if payment_mode == 'COD' else "Completed"

    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        formatted_date = dt.strftime('%d %b %Y, %I:%M %p')
    except:
        formatted_date = date_str

    info_data = [
        [
            Paragraph(f"<b>Order ID:</b> {order_id}", style_value), 
            Paragraph(f"<b>Order Date:</b> {formatted_date}", style_right)
        ],
        [
            Paragraph(f"<b>Payment Method:</b> {payment_label}", style_value),
            Paragraph(f"<b>Payment Status:</b> {payment_status}", style_right)
        ]
    ]
    info_table = Table(info_data, colWidths=[100 * mm, 70 * mm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10 * mm))

    # --- 3. CUSTOMER DETAILS ---
    user = data.get("u", {})
    elements.append(Paragraph("<b>CUSTOMER DETAILS</b>", style_label))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>Name:</b> {user.get('n', '-')}", style_value))
    elements.append(Paragraph(f"<b>Email:</b> {user.get('e', '-')}", style_value))
    elements.append(Paragraph(f"<b>Phone:</b> {user.get('p', '-')}", style_value))
    addr = f"{user.get('a', '-')}, {user.get('c', '-')}, {user.get('z', '-')}"
    elements.append(Paragraph(f"<b>Address:</b> {addr}", style_value))
    elements.append(Spacer(1, 12 * mm))

    # --- 4. ITEM TABLE ---
    headers = ["Product Name", "Quantity", "Price", "Total"]
    table_data = [headers]
    
    col_widths = [90 * mm, 20 * mm, 30 * mm, 30 * mm]
    
    for item in data.get("i", []):
        row = [
            Paragraph(item.get("n", ""), style_value),
            item.get("q", 0),
            _currency(item.get("p", 0)),
            _currency(float(item.get("p", 0)) * int(item.get("q", 0)))
        ]
        table_data.append(row)

    invoice_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    invoice_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), BRAND),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),  
        ('ALIGN', (1, 0), (1, 0), 'CENTER'), 
        ('ALIGN', (2, 0), (-1, 0), 'RIGHT'), 
        
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),  
        ('ALIGN', (1, 1), (1, -1), 'CENTER'), 
        ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),  
        
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E5E5")),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 10 * mm))

    # --- 5. SUMMARY SECTION ---
    subtotal = data.get("s", 0)
    discount = data.get("d", 0)
    shipping_fee = data.get("sh", 40)
    shipping_discount = data.get("sd", 0)
    discount_pct = data.get("dp", 0)
    final_total = data.get("t", 0)

    summary_data = [
        ["Subtotal", _currency(subtotal)],
        ["Shipping", _currency(shipping_fee)]
    ]
    
    if shipping_discount < 0:
        summary_data.append(["Shipping Discount", f"-{_currency(abs(shipping_discount))}"])
        
    if discount > 0:
        label = f"Discount ({discount_pct}%)" if discount_pct else "Discount"
        summary_data.append([label, f"-{_currency(discount)}"])
        
    summary_data.append(["Grand Total", _currency(final_total)])
    
    summary_table = Table(summary_data, colWidths=[130 * mm, 40 * mm])
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
        
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E5E5")),
        
        ('BACKGROUND', (0, -1), (1, -1), ACCENT),
        ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (1, -1), BRAND),
        ('TOPPADDING', (0, -1), (1, -1), 12),
        ('BOTTOMPADDING', (0, -1), (1, -1), 12),
    ]))
    elements.append(summary_table)
    
    elements.append(Spacer(1, 20 * mm))

    # --- 6. FOOTER SECTION ---
    elements.append(Paragraph("<b>Thank you for shopping with Keshvi Crafts <font color='#fba21c'>♥</font></b>", style_footer))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph("<font color='#6b6b6b'>Support: @keshvi_crafts | WhatsApp: +91-7507996961</font>", ParagraphStyle("SubFooter", parent=style_footer, fontSize=8)))

    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    filename = f"Invoice-{data.get('o', 'KC')}.pdf"
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )


if __name__ == "__main__":
    app.run(debug=True)
