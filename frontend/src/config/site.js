/**
 * Single source of truth for storefront identity and public URLs.
 *
 * Only `NEXT_PUBLIC_*` variables are readable in the browser bundle, and they
 * are inlined at build time, so each one is referenced literally rather than
 * through a computed key.
 */
export const siteConfig = Object.freeze({
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Honey Bee Farm',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, ''),
  description:
    'Raw, unfiltered honey harvested from our own hives. Pure, traceable and lab-tested — delivered straight from the farm to your table.',
  contact: Object.freeze({
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 81969 69106',
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@honeybeefarm.local',
    // Country code + number, digits only — WhatsApp rejects spaces and `+`.
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918196969106',
  }),
});

export const ROUTES = Object.freeze({
  home: '/',
  about: '/about',
  shop: '/shop',
  product: (slug) => `/shop/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  orderSuccess: (orderNumber) => `/order-success/${orderNumber}`,
  contact: '/contact',
  faq: '/faq',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  account: '/account',
  accountOrders: '/account/orders',
  accountOrder: (orderNumber) => `/account/orders/${orderNumber}`,
  accountProfile: '/account/profile',
  accountAddresses: '/account/addresses',
  accountWishlist: '/account/wishlist',
  accountPassword: '/account/change-password',
  admin: '/admin',
  privacyPolicy: '/privacy-policy',
  termsConditions: '/terms-conditions',
  shippingPolicy: '/shipping-policy',
  refundPolicy: '/refund-policy',
});
