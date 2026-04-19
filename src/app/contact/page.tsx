import { Metadata } from 'next';

export const metadata: Metadata = {
    description: 'Get in touch with us for orders, inquiries, or support via Instagram or Email.',
};

export default function ContactPage() {
    return (
        <main className="container py-12 max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl font-bold mb-6 text-[#2f2a26]">Contact Us</h1>
            <p className="text-stone-600 mb-8 max-w-xl">
                Have a question about a custom order or need help with a purchase? We&apos;d love to hear from you.
                The fastest way to reach us is via Instagram.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border border-[#eadfcd] shadow-sm flex flex-col">
                    <h2 className="font-bold text-lg mb-4 text-[#C2410C]">Social Media</h2>
                    <p className="text-stone-600 mb-4 flex-grow">
                        Follow us for updates, behind the scenes, and direct messages.
                    </p>
                    <a
                        href="https://www.instagram.com/keshvi_crafts/"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline w-full justify-center text-sm"
                    >
                        Message @keshvicrafts on Instagram
                    </a>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#eadfcd] shadow-sm flex flex-col">
                    <h2 className="font-bold text-lg mb-4 text-[#C2410C]">Instagram Support</h2>
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

                <div className="bg-white p-6 rounded-xl border border-[#eadfcd] shadow-sm flex flex-col">
                    <h2 className="font-bold text-lg mb-4 text-[#C2410C]">Email Support</h2>
                    <p className="text-stone-600 mb-4 flex-grow">
                        For order inquiries or collaborations, drop us a mail.
                    </p>
                    <a href="mailto:keshvicrafts@gmail.com" className="text-stone-800 underline hover:text-[#C2410C] mt-2 inline-block">
                        keshvicrafts@gmail.com
                    </a>
                </div>
            </div>



            <div className="mt-12 pt-8 border-t border-stone-200 text-sm md:text-base">
                <h3 className="font-bold text-stone-800 mb-2">Business Information</h3>
                <div className="text-stone-600 space-y-1">
                    <p><span className="font-semibold">Legal Name:</span> Vaishnavi Sharma | <span className="font-semibold">Trade Name:</span> Keshvi Crafts</p>
                    <p><span className="font-semibold">Type:</span> Sole Proprietorship</p>
                    <p><span className="font-semibold">Address:</span> 167 L, In Front of Indane Gas Godam, New Colony, Madhopur, Surajkund, Gorakhpur, Uttar Pradesh - 273015</p>
                    <p><span className="font-semibold">Email:</span> <a href="mailto:keshvicrafts@gmail.com" className="underline">keshvicrafts@gmail.com</a></p>
                    <p><span className="font-semibold">Phone:</span> +91 7507996961</p>
                </div>
            </div>
        </main>
    );
}
