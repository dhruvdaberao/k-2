import { Metadata } from 'next';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
    description: 'Get in touch with us for orders, inquiries, or support via Instagram or Email.',
};

export default function ContactPage() {
    return (
        <main className="px-4 py-12 md:py-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <BackButton />
                <h1 className="font-serif text-3xl font-bold m-0 text-[#2f2a26]">Contact Us</h1>
            </div>
            <p className="text-stone-600 mb-8 max-w-xl text-base md:text-lg">
                Have a question about a custom order or need help with a purchase? We&apos;d love to hear from you.
                The fastest way to reach us is via Instagram.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gap: '1.5rem' }}>
                <div className="checkout-card rounded-2xl shadow-sm p-6 flex flex-col border border-[#C4A484]" style={{ backgroundColor: '#F5EFE6' }}>
                    <h2 className="font-bold text-lg mb-4 text-[#5a3e2b]">Social Media</h2>
                    <p className="text-stone-600 mb-4 flex-grow">
                        Follow us for updates, behind the scenes, and direct messages.
                    </p>
                    <a
                        href="https://www.instagram.com/keshvi_crafts/"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline w-full justify-center text-sm"
                    >
                        Visit @keshvi_crafts
                    </a>
                </div>

                <div className="checkout-card rounded-2xl shadow-sm p-6 flex flex-col border border-[#C4A484]" style={{ backgroundColor: '#F5EFE6' }}>
                    <h2 className="font-bold text-lg mb-4 text-[#5a3e2b]">Instagram Support</h2>
                    <p className="text-stone-600 mb-4 flex-grow">
                        Need a quick reply or help with a custom order? Chat with us directly on Instagram.
                    </p>
                    <a
                        href="https://ig.me/m/keshvi_crafts"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline w-full justify-center text-sm"
                    >
                        Chat on Instagram
                    </a>
                </div>

                <div className="checkout-card rounded-2xl shadow-sm p-6 flex flex-col border border-[#C4A484]" style={{ backgroundColor: '#F5EFE6' }}>
                    <h2 className="font-bold text-lg mb-4 text-[#5a3e2b]">Email Support</h2>
                    <p className="text-stone-600 mb-4 flex-grow">
                        For order inquiries or collaborations, drop us a mail.
                    </p>
                    <a href="mailto:keshvicrafts@gmail.com" className="text-stone-800 underline hover:text-[#5a3e2b] mt-2 inline-block font-medium">
                        keshvicrafts@gmail.com
                    </a>
                </div>
            </div>



            <div className="border-t border-stone-200" style={{ marginTop: '3.5rem', paddingTop: '2.5rem' }}>
                <h2 className="font-bold text-2xl text-[#2f2a26] mb-6">Business Information</h2>
                <div className="text-stone-600 space-y-4 text-base">
                    <p><span className="font-semibold text-stone-800">Legal Name:</span> Vaishnavi Sharma | <span className="font-semibold text-stone-800">Trade Name:</span> Keshvi Crafts</p>
                    <p><span className="font-semibold text-stone-800">Type:</span> Sole Proprietorship</p>
                    <p><span className="font-semibold text-stone-800" style={{ display: 'block', marginBottom: '4px' }}>Address:</span> 167 L, In Front of Indane Gas Godam, New Colony, Madhopur, Surajkund, Gorakhpur, Uttar Pradesh - 273015</p>
                    <p><span className="font-semibold text-stone-800">Email:</span> <a href="mailto:keshvicrafts@gmail.com" className="underline hover:text-[#5a3e2b]">keshvicrafts@gmail.com</a></p>
                    <p><span className="font-semibold text-stone-800">Phone:</span> +91 7507996961</p>
                </div>
            </div>
        </main>
    );
}
