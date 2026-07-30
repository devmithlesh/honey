/**
 * Crawls every route of the running storefront and checks that each one
 * returns 200 and contains the content it is supposed to.
 */
const BASE = process.env.BASE || 'http://localhost:4000';

let pass = 0;
let fail = 0;
const failures = [];

const check = async (path, { expect = 200, mustContain = [], mustNotContain = [] } = {}) => {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  const html = await res.text();
  const problems = [];

  if (res.status !== expect) problems.push(`status ${res.status} (expected ${expect})`);

  mustContain.forEach((needle) => {
    if (!html.includes(needle)) problems.push(`missing "${needle}"`);
  });

  mustNotContain.forEach((needle) => {
    if (html.includes(needle)) problems.push(`unexpectedly contains "${needle}"`);
  });

  // Next renders a specific marker when a page throws during SSR.
  if (html.includes('Application error: a server-side exception')) {
    problems.push('server-side exception page');
  }

  if (problems.length === 0) {
    pass += 1;
    console.log(`  ok   ${path}`);
  } else {
    fail += 1;
    failures.push(`${path}: ${problems.join('; ')}`);
    console.log(`  FAIL ${path}: ${problems.join('; ')}`);
  }

  return html;
};

const run = async () => {
  console.log('\n== Public pages ==');
  await check('/', {
    mustContain: [
      'Pure raw honey',
      'Why choose us',
      'Honey benefits',
      'Our process',
      'What our customers say',
      'Himalayan Raw Honey', // featured products fetched from the API
      '"@type":"FAQPage"', // structured data
      '918196969106', // WhatsApp number
    ],
  });

  await check('/about', {
    mustContain: ['Meet the beekeepers', 'Our mission', 'Our vision', 'Milestones', 'Harpreet Singh'],
  });

  await check('/shop', {
    mustContain: ['Himalayan Raw Honey', 'Raw Honey', 'Category', 'Maximum price'],
  });

  await check('/shop?category=forest-honey', { mustContain: ['Wild Forest Honey'] });
  await check('/shop?search=beeswax', { mustContain: ['Beeswax'] });
  await check('/shop?sort=price-asc&maxPrice=600', { mustContain: ['product'] });

  await check('/shop/himalayan-raw-honey-500', {
    mustContain: [
      'Himalayan Raw Honey',
      'Add to basket',
      'Buy now',
      'Customer reviews',
      '"@type":"Product"',
      'You might also like',
    ],
  });

  // Next 16 streams App Router responses, so notFound() cannot change the status
  // after headers are sent. The noindex tag is what keeps it out of search.
  await check('/shop/this-does-not-exist', {
    mustContain: ['This page flew the hive', 'name=\"robots\" content=\"noindex'],
  });

  await check('/cart', { mustContain: ['Your basket'] });
  await check('/checkout', { mustContain: ['Checkout'] });
  await check('/contact', {
    mustContain: ['Send us a message', 'Opening hours', 'google.com/maps', '"@type":"LocalBusiness"'],
  });
  await check('/faq', { mustContain: ['Questions, answered', 'Crystallisation', '"@type":"FAQPage"'] });

  console.log('\n== Policy pages ==');
  await check('/privacy-policy', { mustContain: ['Privacy Policy', 'Information we collect'] });
  await check('/terms-conditions', { mustContain: ['Terms &amp; Conditions', 'Governing law'] });
  await check('/shipping-policy', { mustContain: ['Shipping Policy', 'Delivery times'] });
  await check('/refund-policy', { mustContain: ['Refund Policy', 'How refunds are paid'] });

  console.log('\n== Auth pages ==');
  // The credential forms read useSearchParams for the post-login redirect, so they
  // render inside a Suspense boundary: prerendered HTML carries the skeleton and
  // the form arrives on hydration.
  await check('/login', { mustContain: ['<title>Sign in'] });
  await check('/register', { mustContain: ['Create your account'] });
  await check('/forgot-password', { mustContain: ['Forgot your password'] });
  await check('/reset-password', { mustContain: ['<title>Choose a new password'] });
  await check('/reset-password?token=abc123', { mustContain: ['<title>Choose a new password'] });

  console.log('\n== Guarded pages (render the gate, not the data) ==');
  await check('/account', { mustContain: ['Checking your session'] });
  await check('/account/orders', { mustContain: ['Checking your session'] });
  await check('/account/profile', { mustContain: ['Checking your session'] });
  await check('/account/addresses', { mustContain: ['Checking your session'] });
  await check('/account/wishlist', { mustContain: ['Checking your session'] });
  await check('/account/change-password', { mustContain: ['Checking your session'] });
  await check('/account/orders/HB-20260729-ABCDEF', { mustContain: ['Checking your session'] });
  await check('/admin', { mustContain: ['Checking your session'] });
  await check('/admin/orders', { mustContain: ['Checking your session'] });
  await check('/admin/products', { mustContain: ['Checking your session'] });
  await check('/admin/products/new', { mustContain: ['Checking your session'] });
  await check('/admin/categories', { mustContain: ['Checking your session'] });
  await check('/admin/customers', { mustContain: ['Checking your session'] });
  await check('/admin/reviews', { mustContain: ['Checking your session'] });
  await check('/admin/coupons', { mustContain: ['Checking your session'] });
  await check('/admin/settings', { mustContain: ['Checking your session'] });

  console.log('\n== Order success ==');
  await check('/order-success/HB-20260729-ABCDEF', { mustContain: ['Loading your order'] });

  console.log('\n== SEO ==');
  const robots = await check('/robots.txt', { mustContain: ['User-Agent: *', 'Disallow: /admin', 'Sitemap:'] });
  console.log(`       robots.txt:\n${robots.split('\n').map((l) => `         ${l}`).join('\n')}`);

  await check('/sitemap.xml', {
    mustContain: ['<urlset', '/shop/himalayan-raw-honey-500', '/privacy-policy', '/faq'],
  });

  console.log('\n== 404 ==');
  await check('/this-page-does-not-exist', { expect: 404, mustContain: ['This page flew the hive'] });

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Crawl crashed:', error);
  process.exitCode = 1;
});
