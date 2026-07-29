import PageHero from '@/components/shared/PageHero';
import ContactForm from '@/components/contact/ContactForm';
import ContactChannels from '@/components/contact/ContactChannels';
import Reveal from '@/components/motion/Reveal';
import { fetchSettings } from '@/lib/api/server';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Contact us',
  description:
    'Call, email or WhatsApp the farm — we answer every message ourselves. Farm visits by appointment.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: `Contact ${siteConfig.name}`,
    description: 'Call, email or WhatsApp the farm. We answer every message ourselves.',
    url: '/contact',
  },
};

/**
 * Contact page.
 *
 * Contact details come from the settings table so the admin can change the
 * phone number or address from the dashboard without a code change.
 */
export default async function ContactPage() {
  const { data: settings } = await fetchSettings();

  const details = {
    phone: settings?.contact_phone || siteConfig.contact.phone,
    email: settings?.contact_email || siteConfig.contact.email,
    address: settings?.contact_address || 'Hive Road, Rampur, Uttarakhand 244901, India',
    whatsapp: settings?.whatsapp_number || siteConfig.contact.whatsapp,
    instagram: settings?.social_instagram,
    facebook: settings?.social_facebook,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.name,
    description: siteConfig.description,
    telephone: details.phone,
    email: details.email,
    address: { '@type': 'PostalAddress', streetAddress: details.address, addressCountry: 'IN' },
    openingHours: 'Mo-Sa 09:00-19:00',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="Contact"
        title="Talk to the people who keep the bees"
        description="No call centre and no scripts. Whichever way you get in touch, one of us reads it and replies."
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <ContactChannels details={details} />
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-bark-100">
            <iframe
              title={`Map showing ${siteConfig.name}`}
              src="https://www.google.com/maps?q=Rampur,%20Uttarakhand,%20India&output=embed"
              width="100%"
              height="420"
              loading="lazy"
              // The map is decorative context, not a tracker; the strict
              // referrer policy keeps our URLs out of Google's logs.
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block border-0"
            />
          </div>
        </Reveal>
      </div>
    </>
  );
}
