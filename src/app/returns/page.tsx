import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Exchange Policy - Keshvi Crafts',
  description: 'Our policy on returns, exchanges, and cancellations for handmade items.',
};

export default function ReturnsPage() {
  return (
    <main className="container py-12 max-w-3xl mx-auto prose">
      <h1 className="font-serif text-3xl font-bold mb-6">Returns & Exchange Policy</h1>
      <p className="text-stone-500 mb-8 italic">Last updated: {new Date().toLocaleDateString()}</p>

      <h3>1. Returns & Exchanges</h3>
      <p>
        Because our items are carefully handcrafted to order, we only accept returns or exchanges for items that are delivered damaged or defective. If you receive a defective item, please contact us within 7 days of delivery with photographic proof.
      </p>

      <h3>2. Refund Process</h3>
      <p>
        Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment or via direct bank transfer within 5-7 working days.
      </p>

      <h3>3. Cancellation Policy</h3>
      <p>
        Cancellations are only accepted within 24 hours of placing the order. Because our pieces are made to order, once the crafting process has begun after this 24-hour window, we cannot cancel the order.
      </p>

      <h3>4. Size Issues</h3>
      <p>
        For clothing items, please check our size guide carefully before ordering.
        If there is a fit issue, we can alter the piece for a nominal charge, but shipping costs for alterations will be borne by the customer.
      </p>
      <div className="mt-12 pt-8 border-t border-stone-200 text-sm">
        <h3 className="font-bold text-stone-800 mb-2">Business Information</h3>
        <p className="text-stone-600">
          <strong>Keshvi Crafts</strong><br />
          Email: KESHVICRAFTS@gmail.com<br />
          Phone: +91 7507996961
        </p>
      </div>
    </main>
  );
}
