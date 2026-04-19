import { MetadataRoute } from 'next';
import products from '@/data/products.json';
import { DISPLAY_CATEGORIES, CATEGORY_SLUGS } from '@/lib/categories';

const BASE_URL = 'https://keshvicrafts.in';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = [
        '',
        '/collections',
        '/wishlist',
        '/cart',
        '/shipping',
        '/returns',
        '/privacy',
        '/terms',
        '/contact',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    const categoryRoutes = DISPLAY_CATEGORIES.map((category) => ({
        url: `${BASE_URL}/collections/${CATEGORY_SLUGS[category]}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const productRoutes = products.map((product) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
