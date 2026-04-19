import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Keshvi Crafts',
  description: 'Our story, our mission, and our passion for handmade crochet in India.',
};

export default function AboutPage() {
  return (
    <main className="container py-12 max-w-3xl mx-auto prose">
      <h1 className="font-serif text-3xl font-bold mb-6">About Keshvi Crafts</h1>
      
      <p>
        Welcome to Keshvi Crafts, a labor of love founded by Vaishnavi Sharma. Born out of a deep appreciation for the timeless art of crochet, our brand is dedicated to bringing traditional craftsmanship into the modern home. What started as a passion project has blossomed into a small business where every loop, knot, and pattern tells a story of dedication and creativity.
      </p>
      
      <p>
        We believe in the beauty of slow fashion and artisanal decor. In a world of mass-produced goods, we take pride in the fact that our products are entirely handcrafted. From delicate crochet roses to charming accessories, every single piece is made to order. This means that no two items are exactly alike—each carries the unique, thoughtful touch of the maker.
      </p>
      
      <p>
        Proudly based in Gorakhpur, Uttar Pradesh, Keshvi Crafts is committed to delivering quality and warmth across India. When you purchase from us, you aren&apos;t just buying a product; you are supporting a dream, honoring traditional Indian artistry, and taking home a piece that was made with care just for you.
      </p>
    </main>
  );
}
