export const ORDER_CONFIRMATION_STORAGE_KEY = "checkout:order-confirmed:v1";

const API_BASE = (typeof window !== "undefined" ? window.location.origin : "");

export type OrderData = {
  o: string; // order_id
  c: string; // created_at (ISO)
  s: number; // subtotal
  d: number; // discount amount
  sh: number; // shipping fee
  sd: number; // shipping discount
  dp?: number; // discount percentage (e.g., 10 or 20)
  t: number; // total
  h?: string; // origin/host for logo fallback
  pm?: string; // payment mode
  u: {
    n: string; // name
    p: string; // phone
    a: string; // address
    c: string; // city
    z: string; // pincode
  };
  i: Array<{
    n: string; // name
    p: number; // price
    q: number; // quantity
    m: string; // image
  }>;
};

export function generateLocalOrderId(): string {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `KC-${stamp}-${random}`;
}

export function generateDynamicPdfUrl(data: OrderData): string {
  try {
    const origin = (typeof window !== "undefined" ? window.location.origin : "");
    data.h = origin;
    
    // Ensure all images are absolute URLs
    if (data.i) {
      data.i = data.i.map(item => ({
        ...item,
        // Replace hidden special chars from name
        n: (item.n || "").replace(/[^\x20-\x7E]/g, ""),
        m: item.m && !item.m.startsWith("http") ? `${origin}${item.m}` : (item.m || "")
      }));
    }

    // Sanitize user inputs to avoid PDF black boxes (non-ascii chars)
    if (data.u) {
      data.u.n = (data.u.n || "").replace(/[^\x20-\x7E]/g, "");
      data.u.p = (data.u.p || "").replace(/[^\x20-\x7E]/g, "");
      data.u.a = (data.u.a || "").replace(/[^\x20-\x7E]/g, "");
      data.u.c = (data.u.c || "").replace(/[^\x20-\x7E]/g, "");
      data.u.z = (data.u.z || "").replace(/[^\x20-\x7E]/g, "");
    }

    const json = JSON.stringify(data);
    // Base64 encoding that handles unicode
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
    return `${API_BASE}/api/invoice?d=${encodeURIComponent(b64)}`;
  } catch (err) {
    console.error("Failed to generate PDF URL", err);
    return "";
  }
}

// Legacy helpers kept for compatibility or updated for stateless
export function toAbsolutePdfUrl(pdfUrl: string): string {
  return pdfUrl; // Dynamic URLs are already absolute or relative to origin
}
