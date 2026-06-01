'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'unknown';
  const msg = searchParams.get('msg') || 'Your payment could not be processed.';

    return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#FAF8F5]">
      {/* Card Container */}
      <div className="bg-white max-w-[420px] w-full rounded-[20px] px-7 py-10 text-center shadow-[0_2px_16px_rgba(90,62,43,0.07)] border border-[#f0e6d2]">
        
        {/* Red circle with X */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-[22px] font-bold text-[#2f2a26] mb-1.5 font-serif">
          Payment Failed
        </h1>
        <p className="text-sm text-[#6b7280] mb-6 leading-relaxed">
          {msg}
        </p>

        {/* Info card */}
        <div className="bg-[#FAF8F5] border border-[#f0e6d2] rounded-xl p-4 mb-7 text-sm text-stone-500">
          Don't worry, no money was deducted. You can try again or choose a different payment method.
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/checkout"
            className="flex h-[46px] items-center justify-center rounded-[10px] bg-[#5a3e2b] text-white font-semibold text-sm transition-opacity"
          >
            Retry Payment
          </Link>

          <Link
            href="/cart"
            className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] bg-transparent text-[#5a3e2b] font-semibold text-sm border-[1.5px] border-[#5a3e2b] transition-all"
          >
            Back to Bag
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="container min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
