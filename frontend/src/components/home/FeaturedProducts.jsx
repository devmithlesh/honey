import Button from '@/components/ui/Button';
import ProductGrid from '@/components/product/ProductGrid';
import SectionHeading from './SectionHeading';
import Reveal from '@/components/motion/Reveal';
import { ROUTES } from '@/config/site';

/**
 * Featured rail. Products are fetched on the server by the page and passed in,
 * so this section renders as static HTML with no client-side loading state.
 */
export default function FeaturedProducts({ products = [] }) {
  if (products.length === 0) return null;

  return (
    <section className="bg-cream-100 py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Bestsellers"
          title="The jars people come back for"
          description="Our most-ordered honeys, harvested this season and ready to ship today."
        />

        <div className="mt-14">
          <ProductGrid products={products.slice(0, 8)} />
        </div>

        <Reveal className="mt-12 text-center">
          <Button href={ROUTES.shop} variant="outline" size="lg">
            Browse the full range
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
