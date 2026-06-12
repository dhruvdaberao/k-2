import { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { MessageSquare, Truck, PackageCheck, FileText, Shield, Info, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Policies - Keshvi Crafts',
  description: 'Help, support, and policies center for Keshvi Crafts.',
};

export default function HelpPage() {
  return (
    <main className="pt-32 pb-24 px-4 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex items-center gap-3 mb-16">
        <BackButton />
        <h1 className="font-serif text-3xl md:text-4xl font-bold m-0" style={{ color: '#4a3219' }}>Help & Policies</h1>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Link 
          href="/about" 
          className="w-full transition-colors rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <Info size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">About Us</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#C4A484' }} />
        </Link>
        
        <Link 
          href="/contact" 
          className="w-full transition-colors rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <MessageSquare size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Contact Us</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#C4A484' }} />
        </Link>
        
        <Link 
          href="/shipping" 
          className="w-full transition-colors rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <Truck size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Shipping Policy</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#C4A484' }} />
        </Link>
        
        <Link 
          href="/returns" 
          className="w-full transition-colors rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <PackageCheck size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Returns & Exchange Policy</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#C4A484' }} />
        </Link>

        <Link 
          href="/terms" 
          className="w-full transition-colors rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <FileText size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Terms of Service</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#C4A484' }} />
        </Link>
        
        <Link 
          href="/privacy" 
          className="w-full transition-colors rounded-2xl p-5 flex items-center justify-between shadow-sm"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <Shield size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Privacy Policy</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#C4A484' }} />
        </Link>
      </div>
    </main>
  );
}
