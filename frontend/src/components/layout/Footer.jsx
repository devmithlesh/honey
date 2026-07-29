import Link from 'next/link';

import NewsletterForm from './NewsletterForm';
import { ROUTES, siteConfig } from '@/config/site';

const SHOP_LINKS = [
  { href: ROUTES.shop, label: 'All products' },
  { href: `${ROUTES.shop}?category=raw-honey`, label: 'Raw honey' },
  { href: `${ROUTES.shop}?category=organic-honey`, label: 'Organic honey' },
  { href: `${ROUTES.shop}?category=forest-honey`, label: 'Forest honey' },
  { href: `${ROUTES.shop}?category=gift-packs`, label: 'Gift packs' },
];

const COMPANY_LINKS = [
  { href: ROUTES.about, label: 'About us' },
  { href: ROUTES.contact, label: 'Contact' },
  { href: ROUTES.faq, label: 'FAQ' },
  { href: ROUTES.accountOrders, label: 'Track your order' },
];

const POLICY_LINKS = [
  { href: ROUTES.privacyPolicy, label: 'Privacy policy' },
  { href: ROUTES.termsConditions, label: 'Terms & conditions' },
  { href: ROUTES.shippingPolicy, label: 'Shipping policy' },
  { href: ROUTES.refundPolicy, label: 'Refund policy' },
];

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/honeybeefarm', icon: 'IG' },
  { label: 'Facebook', href: 'https://facebook.com/honeybeefarm', icon: 'FB' },
  { label: 'YouTube', href: 'https://youtube.com/@honeybeefarm', icon: 'YT' },
];

/**
 * Site footer. Rendered as a Server Component — nothing here is interactive
 * except the newsletter form, which is its own client island.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-bark-900 text-bark-200">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href={ROUTES.home} className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-full bg-honey-400 text-lg" aria-hidden="true">
                🐝
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-cream-50">
                {siteConfig.name}
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-bark-300">
              {siteConfig.description}
            </p>

            <div className="mt-6 flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-10 place-items-center rounded-full border border-bark-700 text-xs font-bold text-bark-200 transition-colors hover:border-honey-400 hover:bg-honey-400 hover:text-bark-900"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-cream-50 uppercase">
              Stay in touch
            </h3>
            <p className="mt-4 text-sm text-bark-300">
              Harvest news and subscriber-only offers. No spam, ever.
            </p>
            <NewsletterForm className="mt-4" />

            <dl className="mt-6 space-y-1.5 text-sm text-bark-300">
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-honey-300">
                    {siteConfig.contact.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Email</dt>
                <dd>
                  <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-honey-300">
                    {siteConfig.contact.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-bark-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-bark-400">
            © {year} {siteConfig.name}. All rights reserved.
          </p>

          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-bark-400 transition-colors hover:text-honey-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-cream-50 uppercase">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-sm text-bark-300 transition-colors hover:text-honey-300">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
