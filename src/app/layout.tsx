import "./globals.css";
import "./utilities.css";
import Script from "next/script";
import BootstrapNavbar from "@/components/BootstrapNavbar";
import Footer from "@/components/Footer";
import GlobalToast from "@/components/ui/GlobalToast";
import JsonLd from "@/components/JsonLd";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { GoogleTagManager } from '@next/third-parties/google';
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";

import RatingHydrator from "@/components/RatingHydrator";
import { supabase } from "@/lib/supabaseClient";

export const metadata = {
  metadataBase: new URL("https://keshvicrafts.in"),
  title: {
    default: "Keshvi Crafts | Handmade Crochet, Artisanal Home Decor & luxury Gifts",
    template: "%s | Keshvi Crafts",
  },
  description: "Discover Keshvi Crafts for exquisite handmade crochet, artisanal home decor, and sustainable luxury gifts. Made to order in India with premium quality and care.",
  keywords: ["handmade crochet", "artisanal home decor", "luxury sustainable gifts", "custom crochet India", "handcrafted gifts", "crochet flowers", "handmade keychains"],
  openGraph: {
    title: "Keshvi Crafts | Handmade Crochet & Artisanal Decor",
    description: "Premium handmade crochet items and sustainable gifts. Crafted with love in India.",
    url: "https://keshvi-crafts-vercel.vercel.app", // Fallback or main URL
    siteName: "Keshvi Crafts",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pre-fetch all ratings on the server to prevent gray star flashes
  let initialRatings: Record<string, { avg: string | null; count: number }> = {};
  try {
    const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
    if (reviews && reviews.length > 0) {
      const aggregated: Record<string, { sum: number; count: number }> = {};
      for (const r of reviews) {
        const pid = r.product_id;
        if (!aggregated[pid]) aggregated[pid] = { sum: 0, count: 0 };
        aggregated[pid].sum += r.rating;
        aggregated[pid].count += 1;
      }
      for (const pid in aggregated) {
        initialRatings[pid] = {
          avg: (aggregated[pid].sum / aggregated[pid].count).toFixed(1),
          count: aggregated[pid].count
        };
      }
    }
  } catch (err) {
    console.error("Failed to prefetch ratings", err);
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Bootstrap CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css?v=1.0"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Quicksand:wght@300;400;500;600;700&display=swap"
        />
        <link rel="icon" href="/favicon.ico?v=4" sizes="any" />
        <link rel="icon" type="image/png" href="/pwa-icon.png?v=4" />
        <link rel="apple-touch-icon" href="/pwa-icon.png?v=4" />
        <link rel="manifest" href="/manifest.json?v=4" />
        <meta name="theme-color" content="#f1ebe6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-cream text-dark">
        <GoogleTagManager gtmId="GTM-MFVDFHT3" />
        <AnalyticsTracker />
        <ServiceWorkerRegister />
        <RatingHydrator initialRatings={initialRatings} />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <BootstrapNavbar />
              <GlobalToast />
              {children}
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>

        {/* Bootstrap JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js?v=1.0"
          strategy="afterInteractive"
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Keshvi Crafts",
            "image": "https://keshvicrafts.in/logo.png", // Assuming a logo exists or general image
            "description": "Handmade crochet and artisanal home decor, crafted with care in India.",
            "url": "https://keshvicrafts.in",
            "telephone": "+917507996961",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "IN"
            },
            "priceRange": "₹₹",
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "09:00",
              "closes": "18:00"
            },
            "sameAs": [
              "https://instagram.com/keshvi_crafts"
            ]
          }}
        />
      </body>
    </html>
  );
}
