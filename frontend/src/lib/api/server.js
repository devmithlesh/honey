import { siteConfig } from '@/config/site';

/**
 * Server-side data access for public catalogue endpoints.
 *
 * Server Components cannot use the axios client (it carries the browser's
 * in-memory access token), so public reads go through `fetch` directly. This
 * keeps the shop and product pages server-rendered, which is what makes them
 * indexable and gives them real metadata.
 *
 * `next.revalidate` caches responses for a short window so a burst of visitors
 * does not translate into a burst of API calls.
 */
const request = async (path, { revalidate = 60, searchParams } = {}) => {
  const url = new URL(`${siteConfig.apiUrl}${path}`);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });

    if (!response.ok) {
      // 404s are an expected outcome for an unknown slug, not an incident.
      if (response.status !== 404) {
        console.error(`API ${response.status} for ${url.pathname}${url.search}`);
      }
      return { ok: false, status: response.status, data: null, meta: null };
    }

    const body = await response.json();
    return { ok: true, status: response.status, data: body.data, meta: body.meta ?? null };
  } catch (error) {
    // The storefront must still render if the API is briefly unreachable, so
    // callers receive an empty result rather than an exception.
    console.error(`Failed to reach ${url.pathname}:`, error.message);
    return { ok: false, status: 0, data: null, meta: null };
  }
};

export const fetchProducts = (searchParams) =>
  request('/products', { searchParams, revalidate: 60 });

export const fetchFeaturedProducts = (limit = 8) =>
  request('/products/featured', { searchParams: { limit }, revalidate: 300 });

export const fetchProductBySlug = (slug) => request(`/products/${slug}`, { revalidate: 60 });

export const fetchProductReviews = (slug, page = 1) =>
  request(`/products/${slug}/reviews`, { searchParams: { page, limit: 6 }, revalidate: 60 });

export const fetchCategories = () => request('/categories', { revalidate: 300 });

export const fetchSettings = () => request('/settings', { revalidate: 300 });

export default request;
