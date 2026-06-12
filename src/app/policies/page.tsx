import { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { Truck, PackageCheck, FileText, Shield, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Store Policies - Keshvi Crafts',
  description: 'Shipping, returns, privacy, and terms of service for Keshvi Crafts.',
};

export default function PoliciesPage() {
  return (
    <main className="pb-24 px-4 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex items-center gap-3" style={{ marginTop: '40px', marginBottom: '32px' }}>
        <BackButton />
        <h1 className="font-serif text-3xl md:text-4xl font-bold m-0" style={{ color: '#4a3219' }}>Store Policies</h1>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Link 
          href="/shipping" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <Truck size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Shipping Policy</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>
        
        <Link 
          href="/returns" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <PackageCheck size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Returns & Exchange Policy</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>

        <Link 
          href="/terms" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <FileText size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Terms of Service</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>
        
        <Link 
          href="/privacy" 
          className="w-full transition-colors rounded-2xl py-3 px-5 flex items-center justify-between shadow-sm hover:opacity-80"
          style={{ backgroundColor: '#EAE1D3', border: '1px solid #C4A484' }}
        >
          <div className="flex items-center gap-4" style={{ color: '#4a3219' }}>
            <Shield size={24} strokeWidth={1.5} />
            <span className="font-semibold text-[17px]">Privacy Policy</span>
          </div>
          <ChevronRight size={20} strokeWidth={1.5} style={{ color: '#4a3219' }} />
        </Link>
      </div>
    </main>
  );
}
