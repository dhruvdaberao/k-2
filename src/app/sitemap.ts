import { MetadataRoute } from 'next';
import { getLiveProducts } from '@/lib/productsApi';
import { getLiveCategories } from '@/lib/categoriesApi';

const BASE_URL = 'https://keshvicrafts.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const liveProducts = await getLiveProducts();
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

    const categories = await getLiveCategories();
    const categoryRoutes = categories.map((category) => ({
        url: `${BASE_URL}/collections/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const productRoutes = liveProducts.map((product: any) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
