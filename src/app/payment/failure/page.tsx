'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'unknown';
  const msg = searchParams.get('msg') || 'Your payment could not be processed.';

  return (
    <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      
      <h1 className="text-3xl font-serif font-bold text-[#2f2a26] mb-2">Payment Failed</h1>
      
      <p className="text-lg text-stone-600 mb-2">
        {msg}
      </p>
      <p className="text-sm text-stone-400 mb-8 max-w-md mx-auto">
        Don't worry, no money was deducted. You can try again or choose a different payment method.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link href="/checkout" className="btn btn-primary px-8 py-3 rounded-full font-bold shadow-sm min-w-[200px]">
          Retry Payment
        </Link>
        <Link href="/cart" className="btn-secondary px-8 py-3 rounded-full font-bold shadow-sm min-w-[200px] border border-[#d4c5b3] text-[#5a4a42]">
          Back to Bag
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="container min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
