import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Keshvi Crafts',
  description: 'Terms and conditions for shopping with Keshvi Crafts.',
};

export default function TermsPage() {
  return (
    <main className="container py-12 max-w-3xl mx-auto prose">
      <h1 className="font-serif text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-stone-500 mb-8 italic">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-8">
        This website is operated by Keshvi Crafts. Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to Keshvi Crafts. Keshvi Crafts offers this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
      </p>

      <h3>1. General</h3>
      <p>
        By placing an order with Keshvi Crafts, you agree to these terms.
        All our products are handmade, and minor variations in color or size (due to the nature of crochet) are expected and celebrated.
      </p>

      <h3>2. Payments</h3>
      <p>
        We accept payments via UPI, Credit/Debit cards, and Netbanking through our secure payment gateway.
        Orders are confirmed only after payment is received.
      </p>

      <h3>3. Intellectual Property</h3>
      <p>
        All designs, photos, and content on this website are the property of Keshvi Crafts.
        You may not use our images for commercial purposes without permission.
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
