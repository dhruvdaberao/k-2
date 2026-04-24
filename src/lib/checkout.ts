export type CheckoutCustomerDetails = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
};

export type CheckoutPaymentMethod = "cod" | "online";

export type CheckoutReceiptItem = {
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
};

export type PlacedOrder = {
  orderId: string;
  orderedAt: string;
  customer: CheckoutCustomerDetails;
  paymentMethod: CheckoutPaymentMethod;
  items: CheckoutReceiptItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

export function getPaymentMethodLabel(paymentMethod: CheckoutPaymentMethod): string {
  return paymentMethod === "cod" ? "COD" : "Online Payment";
}

export function formatOwnerMessage(order: PlacedOrder): string {
  const itemLines = order.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n");

  return [
    "New Order Received:",
    `Name: ${order.customer.fullName}`,
    `Email: ${order.customer.email}`,
    `Phone: ${order.customer.phoneNumber}`,
    `Address: ${order.customer.address}, ${order.customer.city}, ${order.customer.state}, ${order.customer.country} - ${order.customer.pincode}`,
    "",
    "Items:",
    itemLines,
    "",
    `Total: Rs. ${order.total}`,
    `Payment: ${getPaymentMethodLabel(order.paymentMethod)}`,
  ].join("\n");
}

export function downloadReceiptPdf(order: PlacedOrder) {
  const lines = buildReceiptLines(order);
  const stream = [
    "BT",
    "/F1 11 Tf",
    "50 760 Td",
    ...lines.flatMap((line, index) =>
      index === 0
        ? [`(${escapePdfText(line)}) Tj`]
        : ["0 -16 Td", `(${escapePdfText(line)}) Tj`]
    ),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.3\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.orderId.toLowerCase()}-receipt.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildReceiptLines(order: PlacedOrder): string[] {
  const headerLines = [
    "Keshvi Crafts Receipt",
    `Order ID: ${order.orderId}`,
    `Date: ${order.orderedAt}`,
    "",
    "Customer Details",
    ...wrapLine(`Name: ${order.customer.fullName}`),
    ...wrapLine(`Email: ${order.customer.email}`),
    ...wrapLine(`Phone: ${order.customer.phoneNumber}`),
    ...wrapLine(`Address: ${order.customer.address}`),
    ...wrapLine(`City: ${order.customer.city}`),
    ...wrapLine(`State: ${order.customer.state}`),
    ...wrapLine(`Country: ${order.customer.country}`),
    ...wrapLine(`Pincode: ${order.customer.pincode}`),
    "",
    "Items",
  ];

  const itemLines = order.items.flatMap((item) =>
    wrapLine(`- ${item.name} | Qty: ${item.quantity} | ${formatReceiptAmount(item.lineTotal)}`)
  );

  return [
    ...headerLines,
    ...itemLines,
    "",
    `Subtotal: ${formatReceiptAmount(order.subtotal)}`,
    `Shipping: ${formatReceiptAmount(order.shipping)}`,
    `Total: ${formatReceiptAmount(order.total)}`,
    `Payment Method: ${getPaymentMethodLabel(order.paymentMethod)}`,
  ];
}

function wrapLine(text: string, maxLength = 68): string[] {
  if (text.length <= maxLength) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
      return;
    }
    current = next;
  });

  if (current) lines.push(current);
  return lines;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatReceiptAmount(amount: number): string {
  return amount === 0 ? "Free" : `Rs. ${amount}`;
}
