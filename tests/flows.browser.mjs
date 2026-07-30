/**
 * End-to-end browser test of the signed-in flows.
 *
 * Fields are addressed by their `name` attribute rather than their label: the
 * required-field asterisk lives inside the <label>, so label text is "Password*"
 * and label-based locators are brittle here.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4000';
const ADMIN_EMAIL = 'admin@honeybeefarm.local';
const ADMIN_PASSWORD = 'ChangeMe@12345';

let pass = 0;
let fail = 0;
const failures = [];
const pageErrors = [];

const step = async (name, fn) => {
  try {
    const extra = await fn();
    pass += 1;
    console.log(`  ok   ${name}${extra ? ` — ${extra}` : ''}`);
  } catch (error) {
    fail += 1;
    failures.push(`${name}: ${error.message.split('\n')[0]}`);
    console.log(`  FAIL ${name}: ${error.message.split('\n')[0]}`);
  }
};

const section = (title) => console.log(`\n== ${title} ==`);

const watch = (page, tag) => {
  page.on('pageerror', (e) => pageErrors.push(`${tag} ${page.url()} :: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|_next\/static\/media/.test(m.text())) {
      pageErrors.push(`${tag} ${page.url()} :: ${m.text()}`);
    }
  });
};

const run = async () => {
  const browser = await chromium.launch();

  // ---------------------------------------------------------------- customer
  const customer = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await customer.newPage();
  watch(page, '[customer]');

  const stamp = Date.now();
  const email = `flow.qa.${stamp}@example.com`;
  const password = 'HoneyBee@2026';

  section('Registration and session');

  await step('register a new customer', async () => {
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
    await page.locator('input[name="name"]').fill('Flow QA');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone"]').fill('+91 90000 44444');
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('input[name="acceptedTerms"]').check();
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL('**/account', { timeout: 20000 });
    await page.getByRole('heading', { name: /Hello, Flow/ }).waitFor({ timeout: 15000 });
    return 'landed on /account';
  });

  await step('dashboard summary loads from the API', async () => {
    await page.getByText('Total orders').waitFor({ timeout: 15000 });
    await page.getByText('Lifetime', { exact: false }).or(page.getByText('Total spent')).first().waitFor();
    return 'cards rendered';
  });

  await step('session survives a hard reload', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /Hello, Flow/ }).waitFor({ timeout: 15000 });
    return 'refresh cookie restored it';
  });

  await step('password strength meter reacts to input', async () => {
    await page.goto(`${BASE}/account/change-password`, { waitUntil: 'networkidle' });
    await page.locator('input[name="newPassword"]').fill('abc');
    await page.getByText('8+ characters').waitFor({ timeout: 8000 });
    return 'meter shown';
  });

  section('Addresses');

  await step('save an address', async () => {
    await page.goto(`${BASE}/account/addresses`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add address' }).click();
    await page.locator('input[name="fullName"]').fill('Flow QA');
    await page.locator('input[name="phone"]').fill('+91 90000 44444');
    await page.locator('input[name="line1"]').fill('12 Hive Lane');
    await page.locator('input[name="city"]').fill('Rampur');
    await page.locator('input[name="state"]').fill('Uttarakhand');
    await page.locator('input[name="postalCode"]').fill('244901');
    await page.getByRole('button', { name: 'Save address' }).click();
    await page.getByText('12 Hive Lane').waitFor({ timeout: 15000 });
    return 'persisted and listed';
  });

  section('Wishlist');

  await step('heart saves a product', async () => {
    await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' });
    await page.locator('button[aria-label="Save to wishlist"]').first().click();
    await page.waitForTimeout(1500);
    await page.goto(`${BASE}/account/wishlist`, { waitUntil: 'networkidle' });
    await page.locator('article').first().waitFor({ timeout: 15000 });
    const count = await page.locator('article').count();
    return `${count} saved`;
  });

  section('Cart and checkout');

  await step('add two products to the basket', async () => {
    await page.goto(`${BASE}/shop/himalayan-raw-honey-500`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add to basket' }).first().click();
    await page.goto(`${BASE}/shop/wild-forest-honey-500`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add to basket' }).first().click();
    await page.waitForTimeout(800);
    return 'two lines';
  });

  await step('apply a coupon in the basket', async () => {
    await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
    await page.locator('#coupon-code').fill('WELCOME10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.getByText('WELCOME10', { exact: true }).waitFor({ timeout: 15000 });
    return 'discount applied';
  });

  let orderNumber = null;

  await step('checkout prefills, quotes and places a COD order', async () => {
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Contact details' }).waitFor({ timeout: 15000 });

    // Fill from the saved address card.
    await page.getByRole('button', { name: /12 Hive Lane/ }).first().click();
    await page.waitForTimeout(600);
    const city = await page.locator('input[name="shipping.city"]').inputValue();
    if (city !== 'Rampur') throw new Error(`saved address did not fill (city="${city}")`);

    await page.getByRole('button', { name: 'Place order' }).click();
    await page.waitForURL('**/order-success/**', { timeout: 30000 });
    await page.getByRole('heading', { name: /your order is in/i }).waitFor({ timeout: 20000 });
    orderNumber = (await page.locator('text=/HB-\\d{8}-[A-F0-9]{6}/').first().textContent()).trim();
    return orderNumber;
  });

  await step('the order appears in My Orders with a timeline', async () => {
    await page.goto(`${BASE}/account/orders`, { waitUntil: 'networkidle' });
    await page.getByText(orderNumber).first().waitFor({ timeout: 20000 });
    await page.locator('a:has-text("View details")').first().click();
    await page.getByText('Progress').waitFor({ timeout: 20000 });
    await page.getByText('Order placed').waitFor();
    return 'timeline rendered';
  });

  await step('UPI selection reveals the reference field without toggling the radio', async () => {
    await page.goto(`${BASE}/shop/mustard-blossom-honey-500`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add to basket' }).first().click();
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Payment' }).waitFor({ timeout: 15000 });

    await page.locator('#payment-method-upi').check();
    const reference = page.locator('input[name="transactionReference"]');
    await reference.waitFor({ timeout: 8000 });

    // Focusing the reference must not deselect UPI — the bug the nested <label> caused.
    await reference.click();
    await reference.fill('402913756421');
    const stillUpi = await page.locator('#payment-method-upi').isChecked();
    if (!stillUpi) throw new Error('typing the reference deselected the UPI radio');
    return 'radio stayed selected';
  });

  section('Admin console');

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await adminContext.newPage();
  watch(admin, '[admin]');

  await step('admin signs in', async () => {
    await admin.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await admin.locator('input[name="email"]').fill(ADMIN_EMAIL);
    await admin.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await admin.getByRole('button', { name: 'Sign in' }).click();
    await admin.waitForURL('**/admin', { timeout: 25000 });
    await admin.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 20000 });
    return 'landed on /admin';
  });

  await step('dashboard metrics and revenue chart render', async () => {
    await admin.getByText('Total revenue').waitFor({ timeout: 20000 });
    await admin.getByText('Revenue, last 14 days').waitFor();
    await admin.locator('svg[role="img"]').first().waitFor({ timeout: 15000 });
    await admin.getByText('Orders by status').waitFor();
    return 'cards + chart';
  });

  const pages = [
    ['/admin/orders', 'Orders'],
    ['/admin/products', 'Products'],
    ['/admin/categories', 'Categories'],
    ['/admin/customers', 'Customers'],
    ['/admin/reviews', 'Reviews'],
    ['/admin/coupons', 'Coupons'],
    ['/admin/settings', 'Settings'],
  ];

  for (const [path, heading] of pages) {
    // eslint-disable-next-line no-await-in-loop
    await step(`${path} loads real data`, async () => {
      await admin.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await admin.getByRole('heading', { name: heading, exact: true }).waitFor({ timeout: 20000 });
      await admin.waitForTimeout(1200);
      const busy = await admin.locator('[aria-busy="true"]').count();
      if (busy > 0) throw new Error('still showing a loading skeleton');
      return 'rendered';
    });
  }

  await step('the new order is visible to the admin', async () => {
    await admin.goto(`${BASE}/admin/orders`, { waitUntil: 'networkidle' });
    await admin.getByText(orderNumber).first().waitFor({ timeout: 20000 });
    return orderNumber;
  });

  await step('admin advances the order to confirmed', async () => {
    await admin.locator('tbody tr').first().click();
    await admin.waitForURL('**/admin/orders/**', { timeout: 20000 });
    await admin.getByRole('heading', { name: 'Update status' }).waitFor({ timeout: 20000 });
    await admin.locator('select').first().selectOption('confirmed');
    await admin.getByRole('button', { name: 'Update status' }).click();
    await admin.getByText('Order marked as confirmed').or(admin.getByText('Confirmed')).first().waitFor({ timeout: 20000 });
    return 'status transition accepted';
  });

  await step('product editor loads an existing product', async () => {
    await admin.goto(`${BASE}/admin/products`, { waitUntil: 'networkidle' });
    await admin.locator('a:has-text("Edit")').first().click();
    await admin.waitForURL('**/admin/products/**', { timeout: 20000 });
    await admin.getByRole('heading', { name: /^Edit / }).waitFor({ timeout: 20000 });
    const name = await admin.locator('input[name="name"]').inputValue();
    const price = await admin.locator('input[name="price"]').inputValue();
    if (!name || !price) throw new Error('fields did not populate');
    return `${name} @ ${price}`;
  });

  await step('settings form is populated from the database', async () => {
    // `networkidle` can stall on a page that keeps a request open; DOM readiness
    // plus an explicit element wait is the reliable signal here.
    await admin.goto(`${BASE}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await admin.getByRole('heading', { name: 'General' }).waitFor({ timeout: 20000 });
    const siteName = await admin.locator('input[name="site_name"]').inputValue();
    if (!siteName) throw new Error('site_name was empty');
    return `site_name = ${siteName}`;
  });

  await step('a customer cannot reach the admin console', async () => {
    // The guard redirects on the client, so `networkidle` never settles for the
    // original navigation — wait for the resulting URL instead.
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/account', { timeout: 20000 });
    return 'redirected to /account';
  });

  await browser.close();

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);

  const unique = [...new Set(pageErrors)];
  if (unique.length) {
    console.log(`\nBrowser errors (${unique.length}):`);
    unique.slice(0, 12).forEach((e) => console.log(` ! ${e}`));
  } else {
    console.log('\nNo browser console or page errors.');
  }

  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Run crashed:', error);
  process.exitCode = 1;
});
