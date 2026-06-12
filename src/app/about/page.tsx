import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us - Keshvi Crafts',
  description: 'Our story, our mission, and our passion for handmade crochet in India.',
};

export default function AboutPage() {
  return (
    <main className="container pt-24 pb-12 max-w-4xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-[#2f2a26]">Our Story</h1>
        <p className="text-stone-500 text-lg md:text-xl max-w-2xl mx-auto italic">
          Every loop, knot, and pattern tells a story of dedication and creativity.
        </p>
        
        <div className="flex justify-center mt-8">
            <img src="/nav-icons/chicken-gif.gif" alt="Cute crafting chick" className="w-24 h-24 object-contain" />
        </div>
      </div>
      
      <div className="mb-16 max-w-3xl mx-auto text-center flex flex-col gap-4">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#4a3219] mb-2">Meet the Maker</h2>
        <p className="text-lg text-stone-700">
          Welcome to Keshvi Crafts, a labor of love founded by Vaishnavi Sharma. Born out of a deep appreciation for the timeless art of crochet, our brand is dedicated to bringing traditional craftsmanship into the modern home. 
        </p>
        <p className="text-lg text-stone-700">
          What started as a quiet passion project has blossomed into a small business built on authenticity and artistry. 
        </p>
      </div>

      <div className="bg-[#f5efe6] rounded-2xl p-8 md:p-12 mb-16 shadow-inner text-center">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#4a3219] mb-6">The Magic of Slow Crafting</h2>
        <p className="text-lg text-stone-700 max-w-3xl mx-auto mb-6">
          We believe in the beauty of slow fashion and artisanal decor. In a world of mass-produced goods, we take pride in the fact that our products are entirely handcrafted. From delicate crochet roses to charming accessories, every single piece is made to order.
        </p>
        <p className="text-lg text-stone-700 max-w-3xl mx-auto font-medium">
          This means that no two items are exactly alike—each carries the unique, thoughtful touch of the maker.
        </p>
      </div>

      <div className="mb-16 max-w-3xl mx-auto text-center flex flex-col gap-4">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#4a3219] mb-2">Rooted in Tradition</h2>
        <p className="text-lg text-stone-700">
          Proudly based in Gorakhpur, Uttar Pradesh, Keshvi Crafts is committed to delivering quality and warmth across India. When you purchase from us, you aren&apos;t just buying a product; you are supporting a dream, honoring traditional Indian artistry, and taking home a piece that was made with care just for you.
        </p>
      </div>
    </main>
  );
}
