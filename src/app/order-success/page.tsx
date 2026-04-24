"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ORDER_CONFIRMATION_STORAGE_KEY } from "@/lib/orderClient";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");
  const [loading, setLoading] = useState(true);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    try {
      // 1. Try to restore from local storage (stateless b64 URL)
      const stored = localStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.order_id === orderId && parsed.pdf_url) {
          setInvoiceUrl(parsed.pdf_url);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to a plain orderId reference if storage missing
      const token = searchParams?.get("token");
      const fallbackUrl = `${window.location.origin}/api/invoice?orderId=${orderId}${token ? `&token=${token}` : ""}`;
      setInvoiceUrl(fallbackUrl);
    } catch (e) {
      console.error("Failed to load invoice url", e);
    } finally {
      setLoading(false);
    }
  }, [orderId, router, searchParams]);

  const handleDownloadInvoice = () => {
    if (!invoiceUrl) {
      alert("Invoice URL not ready");
      return;
    }

    window.open(invoiceUrl, "_blank");
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e6ded4', borderTop: '4px solid #5a3e2b', borderRadius: '50%', animation: 'os-spin 0.8s linear infinite' }} />
        <style>{`@keyframes os-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: '#FAF8F5', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* Card Container */}
      <div style={{ background: '#ffffff', maxWidth: 420, width: '100%', borderRadius: 20, padding: '40px 28px 32px', textAlign: 'center', boxShadow: '0 2px 16px rgba(90,62,43,0.07)', border: '1px solid #f0e6d2' }}>
        
        {/* Green circle with tick */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#388e3c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2f2a26', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>
          Order Confirmed
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
          Your order has been successfully placed
        </p>

        {/* Order ID card */}
        <div style={{ background: '#FAF8F5', border: '1px solid #f0e6d2', borderRadius: 12, padding: '14px 18px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Order ID</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2f2a26', fontFamily: 'monospace', letterSpacing: 0.5 }}>{orderId}</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/orders"
            style={{ display: 'flex', height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#5a3e2b', fontWeight: 600, fontSize: 14, textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
          >
            <span style={{ color: '#ffffff' }}>View My Orders</span>
          </Link>

          {orderId && (
            <button
              onClick={handleDownloadInvoice}
              style={{ display: 'flex', height: 46, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, background: 'transparent', color: '#5a3e2b', fontWeight: 600, fontSize: 14, border: '1.5px solid #5a3e2b', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Invoice
            </button>
          )}
        </div>
      </div>

      {/* Back to shopping link */}
      <button
        onClick={() => router.push('/')}
        style={{ marginTop: 20, background: 'none', border: 'none', color: '#8B7355', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
      >
        Continue Shopping
      </button>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
