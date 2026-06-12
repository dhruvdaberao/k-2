import { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { MessageSquare, Truck, PackageCheck, FileText, Shield, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Support - Keshvi Crafts',
  description: 'Help and support center for Keshvi Crafts.',
};

export default function HelpPage() {
  return (
    <main className="pt-28 pb-12 px-4 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex items-center gap-3 mb-12">
        <BackButton />
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#4a3219] m-0">Help & Support</h1>
      </div>

      <div className="w-full flex flex-col gap-3">
        <Link href="/about" className="w-full bg-[#EAE1D3] hover:bg-[#dfd3c0] transition-colors border border-[#C4A484] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[#4a3219]">
            <Info size={22} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">About Us</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/contact" className="w-full bg-[#EAE1D3] hover:bg-[#dfd3c0] transition-colors border border-[#C4A484] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[#4a3219]">
            <MessageSquare size={22} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Contact Us</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/shipping" className="w-full bg-[#EAE1D3] hover:bg-[#dfd3c0] transition-colors border border-[#C4A484] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[#4a3219]">
            <Truck size={22} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Shipping Policy</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/returns" className="w-full bg-[#EAE1D3] hover:bg-[#dfd3c0] transition-colors border border-[#C4A484] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[#4a3219]">
            <PackageCheck size={22} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Returns & Exchanges</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>

        <Link href="/terms" className="w-full bg-[#EAE1D3] hover:bg-[#dfd3c0] transition-colors border border-[#C4A484] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[#4a3219]">
            <FileText size={22} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Terms of Service</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
        
        <Link href="/privacy" className="w-full bg-[#EAE1D3] hover:bg-[#dfd3c0] transition-colors border border-[#C4A484] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-[#4a3219]">
            <Shield size={22} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Privacy Policy</span>
          </div>
          <span className="text-[#C4A484]">&rarr;</span>
        </Link>
      </div>
    </main>
  );
}
