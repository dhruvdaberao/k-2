export const CATEGORY_MAP: Record<string, string> = {
    "Flowers": "Forever Blooms",
    "Pots": "Forever Blooms",
    "Bouquet": "Forever Blooms",
    "Clothing": "Soft Fits",
    "Scarves": "Soft Fits",
    "Home Decor": "Home Feelings",
    "Bags": "Carry Stories",
    "Keyrings": "Little Things",
    "Accessories": "Little Things",
    "Coasters": "Little Things"
};

export const DISPLAY_CATEGORIES = [
    "Forever Blooms",
    "Soft Fits",
    "Home Feelings",
    "Carry Stories",
    "Little Things"
];

export const CATEGORY_SLUGS: Record<string, string> = {
    "Forever Blooms": "forever-blooms",
    "Soft Fits": "soft-fits",
    "Home Feelings": "home-feelings",
    "Carry Stories": "carry-stories",
    "Little Things": "little-things"
};

export const SLUG_TO_CATEGORY: Record<string, string> = {
    "forever-blooms": "Forever Blooms",
    "soft-fits": "Soft Fits",
    "home-feelings": "Home Feelings",
    "carry-stories": "Carry Stories",
    "little-things": "Little Things"
};

export function getDisplayCategory(rawCategory: string): string {
    // Direct match or mapped match, fallback to 'Little Things' or raw
    return CATEGORY_MAP[rawCategory] || rawCategory;
}
