import { siteConfig } from '@/config/site';

/**
 * robots.txt.
 *
 * Everything customer-specific or transactional is disallowed: those pages are
 * already `noindex`, and keeping crawlers out of them saves crawl budget for
 * the catalogue that actually benefits from being indexed.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account', '/cart', '/checkout', '/order-success', '/login', '/register', '/reset-password', '/forgot-password'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
