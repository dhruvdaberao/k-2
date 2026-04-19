export type ProductVariant = {
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock?: number;
  dimensions?: string;
  handcraftedHours?: string;
};

export type ProductCTA = {
  type: "add-to-cart" | "instagram-enquiry";
  label?: string;
  url?: string;
  prefillMessage?: string;
};

export type Product = {
  slug: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category?: string;

  // Stock & Status
  stock?: number;
  status?: "live" | "hidden";

  // Badges & Priority
  badge?: string; // Legacy support
  badges?: string[];
  priority?: number; // Higher number = higher priority
  tags?: string[]; // E.g., "valentine"

  // Product Type Logic
  type?: "direct-purchase" | "custom-order";

  // Pricing nuances
  priceBucket?: "under-500" | "under-1000" | "premium";
  minPrice?: number; // For custom orders
  priceLabel?: string; // "Starts at ₹700"

  // Shipping & Policies
  shippingCharge?: number;
  deliveryTime?: string;
  returnPolicy?: string;

  // Metadata
  materials?: string[];
  dimensions?: string;
  handcraftedHours?: string;

  // External
  checkoutUrl?: string; // Legacy?
  cta?: ProductCTA;

  carts?: string; // Legacy?

  // Variants Logic
  isVariant?: boolean;
  variants?: ProductVariant[];

  // SEO
  seoContent?: {
    intro: string;
    materials: string;
    craftsmanship: string;
    useCases: string;
    care: string;
    faqs: { q: string; a: string }[];
  };
};
