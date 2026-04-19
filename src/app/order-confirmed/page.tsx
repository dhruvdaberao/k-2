"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ORDER_CONFIRMATION_STORAGE_KEY } from "@/lib/orderClient";

type ConfirmationData = {
  order_id: string;
  pdf_url: string;
  payment_method: string;
  total: number;
  created_at: string;
};

const OWNER_PHONE_NUMBER = "7507996961";

export default function OrderConfirmedPage() {
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fromStorage = localStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
    if (fromStorage) {
      try {
        setData(JSON.parse(fromStorage));
      } catch {
        localStorage.removeItem(ORDER_CONFIRMATION_STORAGE_KEY);
        setError("No recent order found.");
      }
    } else {
      setError("No recent order found. Please place an order first.");
    }
  }, []);

  const orderedDate = useMemo(() => {
    if (!data) return "-";
    return new Date(data.created_at).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [data]);

  const instagramLink = `https://ig.me/m/keshvi_crafts`;

  const handleSupportClick = async (e: React.MouseEvent) => {
    const helpMsg = `Hi, I need help with order ${data?.order_id || "N/A"}.`;
    try {
      await navigator.clipboard.writeText(helpMsg);
      if ((window as any).showToast) (window as any).showToast("Help message copied! Please paste it in Instagram.");
    } catch (err) {
      console.error("Failed to copy help msg", err);
    }
  };

  return (
    <main className="checkout-page checkout-container checkout-flow py-10">
      <section className="checkout-card checkout-card--success checkout-section" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="checkout-success" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div className="checkout-success__icon-wrapper" style={{ 
            width: "80px", 
            height: "80px", 
            backgroundColor: "#f0fdf4", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 1.5rem",
            border: "2px solid #bbf7d0",
            flexShrink: 0,
            aspectRatio: "1 / 1"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1a1a1a", marginBottom: "0.5rem" }}>Order Confirmed</h1>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>
              Your handmade items are being prepared. You can download your {data?.payment_method === "cod" ? "Invoice" : "Order Details"} below.
            </p>
          </div>
        </div>

        {data && (
          <div className="checkout-summary-panel" style={{ backgroundColor: "#fdfbf7", border: "1px solid #e7ded1", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem" }}>
            <div className="checkout-summary-panel__row" style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#666", fontWeight: "500" }}>Order ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "1.1rem" }}>{data.order_id}</span>
            </div>
            <div className="checkout-summary-panel__row" style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#666", fontWeight: "500" }}>Date</span>
              <span>{orderedDate}</span>
            </div>
            <div className="checkout-summary-panel__row checkout-summary-panel__row--total" style={{ padding: "1rem 0", display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: "bold" }}>
              <span>Total Amount</span>
              <span style={{ color: "#2e2e2e" }}>Rs. {data.total}</span>
            </div>
          </div>
        )}

        {error && <p className="checkout-note" style={{ color: "#dc2626", textAlign: "center" }}>{error}</p>}

        <div className="checkout-actions checkout-actions--stack" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <a 
            href={data ? `${data.pdf_url}&t=${data.payment_method === "cod" ? "invoice" : "order_details"}` : "#"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary checkout-button" 
            style={{ 
              backgroundColor: "#4a3728", 
              color: "white", 
              textAlign: "center", 
              padding: "1rem", 
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600"
            }} 
            aria-disabled={!data}
          >
            Download {data?.payment_method === "cod" ? "Invoice" : "Order Details"} (PDF)
          </a>
          <a 
            href={instagramLink} 
            onClick={handleSupportClick}
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary checkout-button checkout-button--ghost" 
            style={{ 
              border: "1px solid #4a3728", 
              color: "#4a3728", 
              textAlign: "center", 
              padding: "1rem", 
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Contact us on Instagram
          </a>
          <Link href="/collections" className="btn-secondary checkout-button checkout-button--ghost">
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
