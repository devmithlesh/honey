import { Fraunces, Inter } from 'next/font/google';

import Providers from './providers';
import { siteConfig } from '@/config/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Site-wide defaults. `metadataBase` resolves every relative Open Graph and
 * canonical URL below it, and the title template lets each page supply only
 * its own name.
 */
export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Pure Raw Honey, Straight From Our Hives`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'raw honey',
    'organic honey',
    'forest honey',
    'mustard honey',
    'bee wax',
    'honey farm',
    'unfiltered honey',
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Pure Raw Honey, Straight From Our Hives`,
    description: siteConfig.description,
    url: '/',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Pure Raw Honey`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#f79009',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    // `data-scroll-behavior="smooth"` opts back into Next's scroll handling for
    // route transitions; without it Next 16 no longer overrides the CSS
    // `scroll-behavior: smooth` set in globals.css, making navigations animate.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable}`}
    >
      {/*
        Browser extensions (ColorZilla, Grammarly, password managers) inject
        attributes such as `cz-shortcut-listen` onto <body> before React
        hydrates, which React reports as a hydration mismatch. This suppresses
        the warning for this element's own attributes only — it does not extend
        to descendants, so genuine mismatches inside the app still surface.
      */}
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
