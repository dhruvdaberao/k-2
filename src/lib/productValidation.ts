import { Product } from "@/types";

export const validateProduct = (product: any): Product | null => {
    if (!product || typeof product !== "object") {
        console.error("Invalid product entry:", product);
        return null;
    }

    // Critical fields
    if (!product.slug || typeof product.slug !== "string") {
        console.error("Missing slug for product:", product);
        return null;
    }
    if (!product.title || typeof product.title !== "string") {
        console.error(`Missing title for product ${product.slug}`);
        return null;
    }

    // Ensure images array exists
    if (!Array.isArray(product.images)) {
        console.warn(`Product ${product.slug} has no images array. Defaulting to empty.`);
        product.images = [];
    }

    // Type-specific validation
    if (product.type === "custom-order") {
        if (!product.cta || typeof product.cta !== "object") {
            console.warn(`Custom order product ${product.slug} missing CTA object. patching...`);
            product.cta = {
                type: "instagram-enquiry",
                label: "Enquire on Instagram",
                url: "https://ig.me/m/keshvi_craft", // Fallback
                prefillMessage: `Hi! I'm interested in ${product.title}`
            };
        } else if (!product.cta.url) {
            console.warn(`Custom order product ${product.slug} CTA missing URL. partial patch...`);
            product.cta.url = "https://ig.me/m/keshvi_craft";
        }
    }

    return product as Product;
};

export const filterValidProducts = (products: any[]): Product[] => {
    return products.map(validateProduct).filter(Boolean) as Product[];
};
