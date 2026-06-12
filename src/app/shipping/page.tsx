import { Metadata } from 'next';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Shipping Policy - Keshvi Crafts',
  description: 'Shipping information and delivery timelines for Keshvi Crafts handmade products.',
};

export default function ShippingPage() {
  return (
    <main className="container pb-12 px-4 max-w-3xl mx-auto prose">
      <div className="flex items-center gap-3 mb-6" style={{ marginTop: '40px' }}>
        <BackButton />
        <h1 className="font-serif text-3xl font-bold m-0 text-[#2f2a26]">Shipping Policy</h1>
      </div>
      <p className="text-stone-500 mb-8 italic">Last updated: {new Date().toLocaleDateString()}</p>

      <h3>1. Shipping & Delivery Timelines</h3>
      <p>
        Every piece at Keshvi Crafts is handmade to order. Please allow 7-10 days for us to craft your items with the utmost care. Once dispatched, the estimated delivery duration is 5-10 business days, depending on your location in India.
      </p>

      <h3>2. Shipping Costs</h3>
      <p>
        We offer <strong>Free Shipping</strong> on all orders above ₹650.
        For orders below ₹650, standard shipping rates apply based on the weight and destination, calculated at checkout.
      </p>

      <h3>3. Delivery Partners</h3>
      <p>
        We use reliable courier partners like Delhivery, Xpressbees, and BlueDart to ensure your package reaches you safely.
        Once shipped, you will receive a tracking link via email/SMS.
      </p>

      <h3>4. Delays</h3>
      <p>
        While we strive to meet our timelines, courier delays due to weather or operational issues are out of our control.
        If your package is delayed significantly, please contact us on Instagram.
      </p>
      <h3>5. Shipping Origin</h3>
      <p>
        All orders are shipped from our studio in <strong>India</strong>.
      </p>

      <div className="mt-12 pt-8 border-t border-stone-200 text-sm">
        <h3 className="font-bold text-stone-800 mb-2">Business Information</h3>
        <p className="text-stone-600">
          <strong>Keshvi Crafts</strong><br />
          Email: KESHVICRAFTS@gmail.com<br />
          Phone: +91 7310045515
        </p>
      </div>
    </main>
  );
}
