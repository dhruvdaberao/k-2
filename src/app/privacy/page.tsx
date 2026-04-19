import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Keshvi Crafts',
  description: 'How we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <main className="container py-12 max-w-3xl mx-auto prose">
      <h1 className="font-serif text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-stone-500 mb-8 italic">Last updated: {new Date().toLocaleDateString()}</p>

      <h3>1. Information We Collect</h3>
      <p>
        We collect only the information necessary to fulfill your order, such as your name, address, email, and phone number.
        We do not store your payment details on our servers.
      </p>

      <h3>2. How We Use Your Data</h3>
      <p>
        Your data is used solely for processing your order and communicating with you regarding your purchase.
        We do not sell or share your personal information with third parties for marketing purposes.
      </p>

      <h3>3. Cookies</h3>
      <p>
        We use cookies and similar tracking technologies to track the activity on our website and store certain information. This helps us improve your browsing experience, analyze site traffic, and understand where our visitors are coming from. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
      </p>

      <h3>4. Third-Party Services (Instagram & WhatsApp)</h3>
      <p>
        As a small business, we frequently use third-party platforms like Instagram for marketing and WhatsApp for customer support and order coordination. When you interact with us on these platforms, your data is also governed by their respective Privacy Policies. We do not sell or share your personal information with these third parties beyond what is necessary to fulfill your order and provide support.
      </p>

      <h3>5. Data Security</h3>
      <p>
        We take the security of your personal information seriously. We implement reasonable administrative, technical, and physical security measures to protect your data against unauthorized access, loss, or alteration. However, please remember that no method of transmission over the Internet or method of electronic storage is 100% secure.
      </p>

      <h3>6. Data Controller</h3>
      <p>
        <strong>Keshvi Crafts</strong> is the data controller for your personal information.
        <br />
        Contact: <a href="mailto:KESHVICRAFTS@gmail.com" className="underline">KESHVICRAFTS@gmail.com</a>
      </p>

      <h3>7. Payment Processing</h3>
      <p>
        Payments are processed via a secure third-party gateway (Razorpay/UPI). We do not store or have access to your credit/debit card information.
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
