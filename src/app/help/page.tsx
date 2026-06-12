import { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { MessageSquare, ShieldCheck, Info, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Support - Keshvi Crafts',
  description: 'Help, support, and policies center for Keshvi Crafts.',
};

export default function HelpPage() {
  return (
    <main className="pb-24 px-4 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex items-center gap-3" style={{ marginTop: '40px', marginBottom: '32px' }}>
        <BackButton />
        <h1 className="font-serif text-3xl md:text-4xl font-bold m-0 text-[#2f2a26]">Help & Support</h1>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Link 
          href="/about" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <div className="w-6 flex justify-center"><Info size={22} strokeWidth={1.5} /></div>
            <span className="font-semibold text-[17px]">About Us</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>
        
        <Link 
          href="/contact" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <div className="w-6 flex justify-center"><MessageSquare size={22} strokeWidth={1.5} /></div>
            <span className="font-semibold text-[17px]">Contact Us</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>

        <Link 
          href="/policies" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <div className="w-6 flex justify-center"><ShieldCheck size={22} strokeWidth={1.5} /></div>
            <span className="font-semibold text-[17px]">Store Policies</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>
      </div>
    </main>
  );
}
