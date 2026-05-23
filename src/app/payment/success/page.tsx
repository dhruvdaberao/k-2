'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || 'Pending';

  useEffect(() => {
    // Notify app that bag changed since cart was cleared
    window.dispatchEvent(new CustomEvent("bag:changed"));
  }, []);

  return (
    <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      
      <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-2">Payment Successful!</h1>
      <p className="text-lg text-stone-600 mb-6">
        Thank you for your order. We have received your payment securely.
      </p>
      
      <div className="bg-[#f7f2ed] border border-[#e6ded4] rounded-2xl p-6 mb-8 inline-block min-w-[300px]">
        <p className="text-sm text-stone-500 uppercase tracking-wider mb-1">Order ID</p>
        <p className="text-2xl font-bold text-[#5a3e2b]">{orderId}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link href="/orders" className="btn btn-primary px-8 py-3 rounded-full font-bold shadow-sm min-w-[200px]">
          View Orders
        </Link>
        <Link href="/collections" className="btn-secondary px-8 py-3 rounded-full font-bold shadow-sm min-w-[200px] border border-[#d4c5b3] text-[#5a4a42]">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="container min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
