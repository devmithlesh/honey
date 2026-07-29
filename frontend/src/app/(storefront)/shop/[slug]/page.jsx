import Link from 'next/link';
import { notFound } from 'next/navigation';

import ProductGallery from '@/components/product/ProductGallery';
import AddToCartPanel from '@/components/product/AddToCartPanel';
import ProductTabs from '@/components/product/ProductTabs';
import ProductReviews from '@/components/product/ProductReviews';
import ProductGrid from '@/components/product/ProductGrid';
import Rating from '@/components/ui/Rating';
import Reveal from '@/components/motion/Reveal';
import { fetchProductBySlug, fetchProductReviews } from '@/lib/api/server';
import { ROUTES, siteConfig } from '@/config/site';
import { calculateDiscountPercent, formatCurrency, getEffectivePrice } from '@/lib/utils/format';

/**
 * Per-product metadata. Falls back to the product's own name and short
 * description when the admin has not written explicit SEO fields.
 */
export async function generateMetadata({ params }) {
  // Next 16: `params` is a Promise.
  const { slug } = await params;
  const { data } = await fetchProductBySlug(slug);

  if (!data?.product) {
    return { title: 'Product not found', robots: { index: false, follow: false } };
  }

  const { product } = data;
  const description =
    product.metaDescription || product.shortDescription || siteConfig.description;
  const image = product.images?.[0]?.url;

  return {
    title: product.metaTitle || product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.metaTitle || product.name,
      description,
      url: `/shop/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  const [detailResult, reviewsResult] = await Promise.all([
    fetchProductBySlug(slug),
    fetchProductReviews(slug),
  ]);

  // Renders the root not-found UI and injects `<meta name="robots" content="noindex">`.
  // Next 16 streams App Router responses, so the headers are already sent and the
  // HTTP status stays 200 — the noindex tag is what keeps the page out of search
  // results. See the Status Codes note in the `loading.js` reference.
  if (!detailResult.data?.product) notFound();

  const { product, related = [], ratingBreakdown } = detailResult.data;

  const price = getEffectivePrice(product);
  const hasDiscount = price < Number(product.price);
  const discountPercent = calculateDiscountPercent(product.price, product.discountPrice);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    image: product.images?.map((image) => image.url) || [],
    brand: { '@type': 'Brand', name: siteConfig.name },
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/shop/${product.slug}`,
      priceCurrency: 'INR',
      price: String(price),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    ...(Number(product.ratingCount) > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(product.ratingAverage),
        reviewCount: String(product.ratingCount),
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="container-page py-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-bark-500">
            <li>
              <Link href={ROUTES.home} className="hover:text-honey-700">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={ROUTES.shop} className="hover:text-honey-700">
                Shop
              </Link>
            </li>
            {product.category && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`${ROUTES.shop}?category=${product.category.slug}`}
                    className="hover:text-honey-700"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="font-medium text-bark-700" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery
            images={product.images || []}
            productName={product.name}
            discountPercent={discountPercent}
          />

          <div>
            {product.category && (
              <Link
                href={`${ROUTES.shop}?category=${product.category.slug}`}
                className="text-xs font-semibold tracking-wide text-honey-700 uppercase"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>

            {Number(product.ratingCount) > 0 && (
              <a href="#reviews" className="mt-3 inline-block">
                <Rating value={product.ratingAverage} count={product.ratingCount} showValue />
              </a>
            )}

            {product.shortDescription && (
              <p className="mt-5 text-base leading-relaxed text-bark-600">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-[family-name:var(--font-display)] text-4xl font-semibold text-bark-900">
                {formatCurrency(price)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-lg text-bark-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="rounded-[var(--radius-pill)] bg-leaf-100 px-2.5 py-1 text-xs font-semibold text-leaf-800">
                    You save {formatCurrency(Number(product.price) - price)}
                  </span>
                </>
              )}
            </div>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-bark-100 py-4 text-sm">
              {product.weight && (
                <div>
                  <dt className="text-xs text-bark-500">Net weight</dt>
                  <dd className="mt-0.5 font-semibold text-bark-900">{product.weight}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-bark-500">SKU</dt>
                <dd className="mt-0.5 font-semibold text-bark-900">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-xs text-bark-500">Shelf life</dt>
                <dd className="mt-0.5 font-semibold text-bark-900">24 months</dd>
              </div>
            </dl>

            <div className="mt-7">
              <AddToCartPanel product={product} />
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: '🚚', text: 'Free delivery over ₹999' },
                { icon: '🔬', text: 'Lab-tested for purity' },
                { icon: '🫙', text: 'Glass jar, plastic-free' },
                { icon: '↩️', text: '7-day replacement' },
              ].map((point) => (
                <li key={point.text} className="flex items-center gap-2.5 text-sm text-bark-600">
                  <span aria-hidden="true">{point.icon}</span>
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Reveal className="mt-16 lg:mt-24">
          <ProductTabs product={product} />
        </Reveal>

        <div className="mt-16 lg:mt-24">
          <ProductReviews
            slug={product.slug}
            initialReviews={reviewsResult.data || []}
            initialBreakdown={ratingBreakdown}
            ratingAverage={product.ratingAverage}
            ratingCount={product.ratingCount}
          />
        </div>

        {related.length > 0 && (
          <section className="mt-16 lg:mt-24">
            <h2 className="text-2xl font-semibold sm:text-3xl">You might also like</h2>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
