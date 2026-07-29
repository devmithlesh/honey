import { fetchCategories, fetchProducts } from '@/lib/api/server';
import { siteConfig } from '@/config/site';

/**
 * Dynamic sitemap.
 *
 * Static marketing pages are listed explicitly; products and categories are
 * pulled from the API so a newly published jar is discoverable without a
 * redeploy. Account, admin, cart and checkout are deliberately absent — they
 * are `noindex` and have nothing to offer a crawler.
 */
export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-conditions', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/shipping-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap() {
  const now = new Date();

  const entries = STATIC_ROUTES.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // A sitemap must still be served if the API is unreachable, so failures fall
  // back to the static routes rather than throwing.
  const [productsResult, categoriesResult] = await Promise.all([
    fetchProducts({ limit: 100, page: 1 }),
    fetchCategories(),
  ]);

  (productsResult.data || []).forEach((product) => {
    entries.push({
      url: `${siteConfig.url}/shop/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  (categoriesResult.data || []).forEach((category) => {
    entries.push({
      url: `${siteConfig.url}/shop?category=${category.slug}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  return entries;
}
