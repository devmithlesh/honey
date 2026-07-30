/**
 * End-to-end smoke test for the Honey Bee Farm API.
 * Exercises every route group against the live database.
 */
const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';

let pass = 0;
let fail = 0;
const failures = [];

const jar = new Map();

const captureCookies = (res) => {
  const raw = res.headers.getSetCookie?.() || [];
  raw.forEach((cookie) => {
    const [pair] = cookie.split(';');
    const idx = pair.indexOf('=');
    jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1));
  });
};

const cookieHeader = () =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

async function call(method, path, { body, token, expect = 200, label } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (jar.size) headers.Cookie = cookieHeader();

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  captureCookies(res);

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  const name = label || `${method} ${path}`;
  const expected = Array.isArray(expect) ? expect : [expect];

  if (expected.includes(res.status)) {
    pass += 1;
    console.log(`  ok   ${name} -> ${res.status}`);
  } else {
    fail += 1;
    const detail = `${name} -> ${res.status} (expected ${expected.join('/')}) :: ${JSON.stringify(json).slice(0, 300)}`;
    failures.push(detail);
    console.log(`  FAIL ${detail}`);
  }

  return json;
}

const section = (title) => console.log(`\n== ${title} ==`);

const run = async () => {
  section('Public catalogue');
  const products = await call('GET', '/products?page=1&limit=3');
  const slug = products.data?.[0]?.slug;
  console.log(`       first product: ${slug} (total ${products.meta?.pagination?.totalItems})`);

  await call('GET', '/products?search=honey&sort=price-asc&minPrice=100&maxPrice=2000');
  await call('GET', '/products?category=raw-honey&inStock=true&minRating=1');
  await call('GET', '/products?maxPrice=600', { label: 'GET /products (maxPrice only)' });
  await call('GET', '/products?minPrice=400', { label: 'GET /products (minPrice only)' });
  await call('GET', '/products/featured');
  await call('GET', `/products/${slug}`);
  await call('GET', `/products/${slug}/related`);
  await call('GET', `/products/${slug}/reviews`);
  await call('GET', '/products/does-not-exist', { expect: 404 });
  await call('GET', '/products?minPrice=900&maxPrice=100', { expect: 422, label: 'GET /products (bad price range)' });

  await call('GET', '/categories');
  await call('GET', '/categories/raw-honey');
  await call('GET', '/categories/nope', { expect: 404 });
  await call('GET', '/settings');

  section('Auth');
  const stamp = Date.now();
  const email = `qa.customer.${stamp}@example.com`;
  const password = 'HoneyBee@2026';

  await call('POST', '/auth/register', {
    body: { name: 'Q', email, password, confirmPassword: password },
    expect: 422,
    label: 'POST /auth/register (short name)',
  });
  await call('POST', '/auth/register', {
    body: { name: 'QA Customer', email, password: 'weak', confirmPassword: 'weak' },
    expect: 422,
    label: 'POST /auth/register (weak password)',
  });

  const registered = await call('POST', '/auth/register', {
    body: { name: 'QA Customer', email, phone: '+91 90000 11111', password, confirmPassword: password },
    expect: 201,
  });
  let token = registered.data?.accessToken;

  await call('POST', '/auth/register', {
    body: { name: 'QA Customer', email, password, confirmPassword: password },
    expect: 409,
    label: 'POST /auth/register (duplicate email)',
  });

  await call('POST', '/auth/login', {
    body: { email, password: 'WrongPass@123' },
    expect: 401,
    label: 'POST /auth/login (wrong password)',
  });

  const loggedIn = await call('POST', '/auth/login', { body: { email, password } });
  token = loggedIn.data?.accessToken;

  await call('GET', '/auth/me', { token });
  await call('GET', '/auth/me', { expect: 401, label: 'GET /auth/me (no token)' });
  await call('GET', '/auth/me', { token: 'garbage.token.here', expect: 401, label: 'GET /auth/me (bad token)' });

  const refreshed = await call('POST', '/auth/refresh');
  token = refreshed.data?.accessToken || token;

  await call('POST', '/auth/forgot-password', { body: { email } });

  section('Profile / addresses / wishlist');
  await call('GET', '/users/me', { token });
  await call('PATCH', '/users/me', { token, body: { name: 'QA Customer Renamed', phone: '+91 90000 22222' } });
  await call('GET', '/users/me/dashboard', { token });

  const address = await call('POST', '/users/me/addresses', {
    token,
    expect: 201,
    body: {
      label: 'Home',
      fullName: 'QA Customer',
      phone: '+91 90000 11111',
      line1: '12 Hive Lane',
      line2: 'Near the orchard',
      city: 'Rampur',
      state: 'Uttarakhand',
      postalCode: '244901',
      country: 'India',
      type: 'shipping',
      isDefault: true,
    },
  });
  const addressId = address.data?.id;

  await call('POST', '/users/me/addresses', {
    token,
    expect: 422,
    body: { fullName: 'X', phone: 'abc', line1: '', city: '', state: '', postalCode: 'zzz' },
    label: 'POST /users/me/addresses (invalid)',
  });

  await call('GET', '/users/me/addresses', { token });
  await call('PUT', `/users/me/addresses/${addressId}`, { token, body: { city: 'Nainital' } });
  await call('PATCH', `/users/me/addresses/${addressId}/default`, { token });

  const productId = products.data?.[0]?.id;
  await call('POST', '/users/me/wishlist', { token, expect: 201, body: { productId: Number(productId) } });
  await call('GET', '/users/me/wishlist', { token });
  await call('POST', '/users/me/wishlist/toggle', { token, body: { productId: Number(productId) } });
  await call('POST', '/users/me/wishlist/toggle', { token, body: { productId: Number(productId) } });
  await call('DELETE', `/users/me/wishlist/${productId}`, { token });

  section('Coupons + checkout quote');
  await call('POST', '/coupons/validate', {
    body: { code: 'NOPE', subtotal: 1000 },
    expect: 404,
    label: 'POST /coupons/validate (unknown code)',
  });
  await call('POST', '/coupons/validate', {
    body: { code: 'HONEY50', subtotal: 100 },
    expect: 400,
    label: 'POST /coupons/validate (below minimum)',
  });
  await call('POST', '/coupons/validate', { body: { code: 'WELCOME10', subtotal: 1200 } });

  const quote = await call('POST', '/orders/quote', {
    token,
    body: { items: [{ productId: Number(productId), quantity: 2 }], couponCode: 'WELCOME10' },
  });
  console.log(`       quote: subtotal=${quote.data?.subtotal} discount=${quote.data?.discountTotal} shipping=${quote.data?.shippingTotal} total=${quote.data?.grandTotal}`);

  await call('POST', '/orders/quote', {
    body: { items: [{ productId: 999999, quantity: 1 }] },
    expect: 400,
    label: 'POST /orders/quote (missing product)',
  });
  await call('POST', '/orders/quote', {
    body: { items: [{ productId: Number(productId), quantity: 9999 }] },
    expect: 422,
    label: 'POST /orders/quote (quantity over cap)',
  });

  section('Order placement');
  const orderBody = {
    items: [{ productId: Number(productId), quantity: 2 }],
    customerName: 'QA Customer',
    customerEmail: email,
    customerPhone: '+91 90000 11111',
    shippingAddress: {
      fullName: 'QA Customer',
      phone: '+91 90000 11111',
      line1: '12 Hive Lane',
      city: 'Rampur',
      state: 'Uttarakhand',
      postalCode: '244901',
      country: 'India',
    },
    paymentMethod: 'cod',
    couponCode: 'WELCOME10',
    customerNote: 'Please deliver in the morning.',
  };

  const order = await call('POST', '/orders', { token, expect: 201, body: orderBody });
  const orderNumber = order.data?.orderNumber;
  const orderId = order.data?.id;
  console.log(`       order ${orderNumber} total=${order.data?.grandTotal} status=${order.data?.status}`);

  await call('POST', '/orders', {
    token,
    expect: 400,
    body: { ...orderBody, couponCode: 'WELCOME10' },
    label: 'POST /orders (coupon reuse blocked)',
  });

  await call('POST', '/orders', {
    expect: 422,
    body: { ...orderBody, couponCode: null, paymentMethod: 'upi' },
    label: 'POST /orders (upi without reference)',
  });

  const guestOrder = await call('POST', '/orders', {
    expect: 201,
    body: {
      ...orderBody,
      couponCode: null,
      customerEmail: `guest.${stamp}@example.com`,
      paymentMethod: 'upi',
      transactionReference: `UPI${stamp}`,
    },
    label: 'POST /orders (guest, UPI)',
  });

  await call('GET', `/orders/${orderNumber}`, { token });
  await call('GET', `/orders/${guestOrder.data?.orderNumber}`, { label: 'GET /orders/:num (guest, no session)' });
  await call('GET', '/orders/HB-20200101-ABCDEF', { expect: 404 });
  await call('GET', '/orders/not-an-order-number', { expect: 422 });
  await call('GET', '/users/me/orders', { token });

  section('Reviews');
  await call('POST', `/products/${slug}/reviews`, {
    token,
    expect: 201,
    body: { rating: 5, title: 'Excellent honey', comment: 'Rich, floral and genuinely raw.' },
  });
  await call('POST', `/products/${slug}/reviews`, {
    token,
    expect: 409,
    body: { rating: 4 },
    label: 'POST review (duplicate blocked)',
  });
  await call('POST', `/products/${slug}/reviews`, {
    token,
    expect: 422,
    body: { rating: 9 },
    label: 'POST review (rating out of range)',
  });

  section('Admin guard');
  await call('GET', '/admin/dashboard', { expect: 401, label: 'GET /admin/dashboard (anon)' });
  await call('GET', '/admin/dashboard', { token, expect: 403, label: 'GET /admin/dashboard (customer)' });

  section('Admin');
  const adminLogin = await call('POST', '/auth/login', {
    body: {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@honeybeefarm.local',
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@12345',
    },
    label: 'POST /auth/login (admin)',
  });
  const adminToken = adminLogin.data?.accessToken;

  const dashboard = await call('GET', '/admin/dashboard', { token: adminToken });
  console.log(`       revenue=${dashboard.data?.cards?.totalRevenue} orders=${dashboard.data?.cards?.totalOrders} lowStock=${dashboard.data?.cards?.lowStockCount}`);

  await call('GET', '/admin/products?page=1&limit=5', { token: adminToken });
  await call('GET', '/admin/products?lowStock=true', { token: adminToken });
  await call('GET', '/admin/categories', { token: adminToken });
  await call('GET', '/admin/customers', { token: adminToken });
  await call('GET', '/admin/orders', { token: adminToken });
  await call('GET', `/admin/orders/${orderId}`, { token: adminToken });
  await call('GET', `/admin/orders/${orderId}/invoice`, { token: adminToken });
  await call('GET', '/admin/reviews?status=pending', { token: adminToken });
  await call('GET', '/admin/coupons', { token: adminToken });
  await call('GET', '/admin/settings', { token: adminToken });
  await call('GET', '/admin/notifications', { token: adminToken });

  section('Admin writes');
  const category = await call('POST', '/admin/categories', {
    token: adminToken,
    expect: 201,
    body: { name: `QA Category ${stamp}`, description: 'Temporary category', sortOrder: 99 },
  });
  const categoryId = category.data?.id;

  await call('PUT', `/admin/categories/${categoryId}`, {
    token: adminToken,
    body: { description: 'Updated description', isActive: true },
  });

  const newProduct = await call('POST', '/admin/products', {
    token: adminToken,
    expect: 201,
    body: {
      name: `QA Honey ${stamp}`,
      categoryId: Number(categoryId),
      price: 500,
      discountPrice: 450,
      stock: 25,
      shortDescription: 'A test product created by the smoke suite.',
      weight: '250 g',
      isFeatured: false,
      isActive: true,
    },
  });
  const newProductId = newProduct.data?.id;

  await call('POST', '/admin/products', {
    token: adminToken,
    expect: 422,
    body: { name: 'Bad', categoryId: Number(categoryId), price: 100, discountPrice: 200, stock: 1 },
    label: 'POST /admin/products (discount above price)',
  });

  await call('PUT', `/admin/products/${newProductId}`, {
    token: adminToken,
    body: { stock: 40, isFeatured: true },
  });

  const coupon = await call('POST', '/admin/coupons', {
    token: adminToken,
    expect: 201,
    body: { code: `QA${stamp}`, type: 'percentage', value: 15, minOrderAmount: 100, usageLimitPerUser: 1 },
  });
  const couponId = coupon.data?.id;

  await call('POST', '/admin/coupons', {
    token: adminToken,
    expect: 422,
    body: { code: `QAPCT${stamp}`, type: 'percentage', value: 150 },
    label: 'POST /admin/coupons (percentage over 100)',
  });

  await call('PUT', `/admin/coupons/${couponId}`, { token: adminToken, body: { isActive: false } });

  const reviews = await call('GET', '/admin/reviews?status=pending', { token: adminToken });
  const reviewId = reviews.data?.[0]?.id;
  if (reviewId) {
    await call('PATCH', `/admin/reviews/${reviewId}/status`, {
      token: adminToken,
      body: { status: 'approved' },
    });
  }

  section('Order lifecycle');
  await call('PATCH', `/admin/orders/${orderId}/status`, {
    token: adminToken,
    body: { status: 'shipped' },
    expect: 400,
    label: 'PATCH order status (illegal jump pending->shipped)',
  });
  await call('PATCH', `/admin/orders/${orderId}/status`, { token: adminToken, body: { status: 'confirmed' } });
  await call('PATCH', `/admin/orders/${orderId}/status`, { token: adminToken, body: { status: 'packed' } });
  await call('PATCH', `/admin/orders/${orderId}/status`, { token: adminToken, body: { status: 'shipped' } });
  await call('PATCH', `/admin/orders/${orderId}/status`, { token: adminToken, body: { status: 'delivered' } });
  await call('PATCH', `/admin/orders/${orderId}/status`, {
    token: adminToken,
    body: { status: 'cancelled' },
    expect: 400,
    label: 'PATCH order status (cancel after delivery blocked)',
  });

  const guestOrderId = guestOrder.data?.id;
  await call('PATCH', `/admin/orders/${guestOrderId}/payment`, {
    token: adminToken,
    body: { status: 'paid', transactionReference: `UPI${stamp}` },
  });
  await call('PATCH', `/admin/orders/${guestOrderId}/status`, {
    token: adminToken,
    body: { status: 'cancelled', cancelReason: 'Smoke test cleanup' },
  });

  section('Customer cancellation + stock restore');
  const cancellable = await call('POST', '/orders', {
    token,
    expect: 201,
    body: { ...orderBody, couponCode: null },
    label: 'POST /orders (for cancellation)',
  });
  await call('POST', `/users/me/orders/${cancellable.data?.orderNumber}/cancel`, {
    token,
    body: { reason: 'Changed my mind' },
  });

  section('Settings write');
  await call('PUT', '/admin/settings', {
    token: adminToken,
    body: { site_tagline: 'Pure raw honey, straight from our hives' },
  });

  section('Cleanup');
  await call('DELETE', `/admin/products/${newProductId}`, { token: adminToken });
  await call('DELETE', `/admin/coupons/${couponId}`, { token: adminToken });
  await call('DELETE', `/admin/categories/${categoryId}`, { token: adminToken });
  await call('DELETE', `/users/me/addresses/${addressId}`, { token });
  await call('POST', '/auth/logout', { token });

  section('404 handling');
  await call('GET', '/nope', { expect: 404 });

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Smoke run crashed:', error);
  process.exitCode = 1;
});
