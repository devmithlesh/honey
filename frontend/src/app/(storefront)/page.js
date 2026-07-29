import Hero from '@/components/home/Hero';
import AboutFarm from '@/components/home/AboutFarm';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import HoneyBenefits from '@/components/home/HoneyBenefits';
import BeeFarmingProcess from '@/components/home/BeeFarmingProcess';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Testimonials from '@/components/home/Testimonials';
import FaqSection from '@/components/home/FaqSection';
import ContactCta from '@/components/home/ContactCta';
import NewsletterBand from '@/components/home/NewsletterBand';
import { fetchFeaturedProducts } from '@/lib/api/server';
import { FAQS } from '@/config/content';
import { siteConfig } from '@/config/site';

export const metadata = {
  alternates: { canonical: '/' },
};

/**
 * Home page.
 *
 * A Server Component: the featured products are fetched during the render, so
 * the section ships as real HTML that search engines can read, with no
 * client-side loading flash.
 */
export default async function HomePage() {
  const { data: featured } = await fetchFeaturedProducts(8);

  // Structured data for the organisation and the FAQ block, which is what earns
  // the expandable question rows in search results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: siteConfig.contact.phone,
          email: siteConfig.contact.email,
          contactType: 'customer service',
          areaServed: 'IN',
        },
      },
      {
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteConfig.url}/shop?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.slice(0, 5).map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero />
      <AboutFarm />
      <WhyChooseUs />
      <FeaturedProducts products={featured || []} />
      <HoneyBenefits />
      <BeeFarmingProcess />
      <Testimonials />
      <FaqSection />
      <NewsletterBand />
      <ContactCta />
    </>
  );
}
