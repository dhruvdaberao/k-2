import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Us - Keshvi Crafts',
  description: 'Our story, our mission, and our passion for handmade crochet in India.',
};

export default function AboutPage() {
  return (
    <main className="container py-12 max-w-4xl mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-[#2f2a26]">Our Story</h1>
        <p className="text-stone-500 text-lg md:text-xl max-w-2xl mx-auto italic">
          Every loop, knot, and pattern tells a story of dedication and creativity.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-10 items-center mb-16">
        <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-lg border border-[#e6dccf]">
          <Image 
            src="/about-founder.png" 
            alt="Vaishnavi crafting crochet" 
            width={600} 
            height={600} 
            className="w-full h-auto object-cover aspect-square"
          />
        </div>
        <div className="w-full md:w-1/2 prose prose-stone lg:prose-lg">
          <h2 className="font-serif text-3xl font-bold text-[#4a3219]">Meet the Maker</h2>
          <p>
            Welcome to Keshvi Crafts, a labor of love founded by Vaishnavi Sharma. Born out of a deep appreciation for the timeless art of crochet, our brand is dedicated to bringing traditional craftsmanship into the modern home. 
          </p>
          <p>
            What started as a quiet passion project has blossomed into a small business built on authenticity and artistry. 
          </p>
        </div>
      </div>

      <div className="bg-[#f5efe6] rounded-2xl p-8 md:p-12 mb-16 shadow-inner text-center">
        <h2 className="font-serif text-3xl font-bold text-[#4a3219] mb-6">The Magic of Slow Crafting</h2>
        <p className="text-lg text-stone-700 max-w-3xl mx-auto mb-6">
          We believe in the beauty of slow fashion and artisanal decor. In a world of mass-produced goods, we take pride in the fact that our products are entirely handcrafted. From delicate crochet roses to charming accessories, every single piece is made to order.
        </p>
        <p className="text-lg text-stone-700 max-w-3xl mx-auto font-medium">
          This means that no two items are exactly alike—each carries the unique, thoughtful touch of the maker.
        </p>
      </div>

      <div className="text-center prose prose-stone lg:prose-lg max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-[#4a3219]">Rooted in Tradition</h2>
        <p>
          Proudly based in Gorakhpur, Uttar Pradesh, Keshvi Crafts is committed to delivering quality and warmth across India. When you purchase from us, you aren&apos;t just buying a product; you are supporting a dream, honoring traditional Indian artistry, and taking home a piece that was made with care just for you.
        </p>
      </div>
    </main>
  );
}
