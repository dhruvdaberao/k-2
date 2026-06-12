import { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Help & Support - Keshvi Crafts',
  description: 'Help and support center for Keshvi Crafts.',
};

export default function HelpPage() {
  return (
    <main className="container pt-28 pb-12 px-4 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex items-center gap-3 mb-10">
        <BackButton />
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#4a3219] m-0">Help & Support</h1>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Link href="/contact" className="w-full bg-[#F5EFE6] hover:bg-[#EAE1D3] transition-colors border border-[#C4A484] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">💬</span>
            <span className="font-semibold text-[#4a3219] text-lg">Contact Us</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/shipping" className="w-full bg-[#F5EFE6] hover:bg-[#EAE1D3] transition-colors border border-[#C4A484] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🚚</span>
            <span className="font-semibold text-[#4a3219] text-lg">Shipping Policy</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/returns" className="w-full bg-[#F5EFE6] hover:bg-[#EAE1D3] transition-colors border border-[#C4A484] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">📦</span>
            <span className="font-semibold text-[#4a3219] text-lg">Returns & Exchanges</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>

        <Link href="/terms" className="w-full bg-[#F5EFE6] hover:bg-[#EAE1D3] transition-colors border border-[#C4A484] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">📜</span>
            <span className="font-semibold text-[#4a3219] text-lg">Terms of Service</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/privacy" className="w-full bg-[#F5EFE6] hover:bg-[#EAE1D3] transition-colors border border-[#C4A484] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🔒</span>
            <span className="font-semibold text-[#4a3219] text-lg">Privacy Policy</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
      </div>
    </main>
  );
}
