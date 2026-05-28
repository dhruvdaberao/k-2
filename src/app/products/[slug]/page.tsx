import { getLiveProducts, getProductBySlug } from "@/lib/productsApi";
import ProductPageClient from "@/components/ProductPageClient";
import { getProductRating } from "@/lib/ratingUtils";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/types";

type P = any;

// Required for output:'export' on a dynamic route
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const liveProducts = await getLiveProducts();
  return liveProducts
    .filter((p: any) => p.slug)
    .map((p: any) => ({ slug: String(p.slug) }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const p = await getProductBySlug(slug);

  if (!p) {
    return {
      title: "Product Not Found | Keshvi Crafts",
    };
  }

  const title = `${p.title} | Handmade Crochet & Gifts`;
  const description = p.description || `Buy ${p.title} - Handmade crochet item. Custom made with love.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: p.images && p.images.length > 0 ? [{ url: p.images[0] }] : [],
      url: `https://keshvicrafts.in/products/${p.slug}`,
    },
    alternates: {
      canonical: `https://keshvicrafts.in/products/${p.slug}`,
    }
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const allLive = await getLiveProducts();

  // Get related products (same category, exclude current)
  const relatedProducts = allLive
    .filter((prod: any) => prod.category === p.category && prod.slug !== p.slug)
    .slice(0, 4);

  // Pre-fetch rating on the server
  const rating = await getProductRating(p.id || p.slug);

  const inStock = (typeof p.stock === "number" ? p.stock > 0 : true) || p.type === "custom-order";
  const jsonLdData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": p.title,
    "image": p.images && p.images.length > 0 ? p.images.map((img: string) => `https://keshvicrafts.in${img}`) : [],
    "description": p.description,
    "sku": p.slug,
    "brand": {
      "@type": "Brand",
      "name": "Keshvi Crafts"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://keshvicrafts.in/products/${p.slug}`,
      "priceCurrency": "INR",
      "price": p.minPrice || p.price,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://keshvicrafts.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": p.category || "Products",
        "item": `https://keshvicrafts.in/collections?category=${encodeURIComponent(p.category || "")}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": p.title,
        "item": `https://keshvicrafts.in/products/${p.slug}`
      }
    ]
  };

  return (
    <main className="container" style={{ padding: "16px 16px 4rem" }}>
      <JsonLd data={jsonLdData} />
      <JsonLd data={breadcrumbData} />

      <Link href="/" className="meta" style={{ display: "inline-block", marginBottom: 16, textDecoration: "none" }}>
        ← Back to all products
      </Link>

      <ProductPageClient product={p} relatedProducts={relatedProducts} initialRating={rating} />
    </main>
  );
}
