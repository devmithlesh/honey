# Test suites

Three suites, each running against a live stack rather than mocks. They are
plain Node scripts with no test-runner dependency — only the browser suite needs
Playwright.

```bash
npm install          # from the repository root: installs Playwright
npm run test:setup   # downloads Chromium (once)
```

Start the API and the storefront first:

```bash
cd backend  && npm run dev     # http://localhost:5000/api/v1
cd frontend && npm run dev     # http://localhost:4000
```

Then, from the repository root:

```bash
npm test             # all three, in order
npm run test:api
npm run test:routes
npm run test:flows
```

## 1. `api.smoke.mjs` — the REST API

Exercises every route group against the real database: registration, login,
token refresh, the profile, addresses, the wishlist, coupon rules, checkout
quoting, order placement, the full order lifecycle, review moderation, the admin
CRUD endpoints and the authorisation boundaries between them. It asserts the
rejections too — an expired coupon, an illegal status transition, a duplicate
email, a cart quantity over the cap.

```bash
node tests/api.smoke.mjs
```

It creates and then deletes its own fixtures, but it does leave the customer
account and the orders it placed behind, because orders are never hard-deleted.

## 2. `routes.crawl.mjs` — every page renders

Fetches every route and asserts the HTML actually contains what that page is
for: the featured products on the home page, the filters on the shop, the
JSON-LD blocks, the policy headings, `robots.txt` and `sitemap.xml`. It also
fails a page that renders Next's server-exception screen.

```bash
node tests/routes.crawl.mjs
BASE=http://localhost:4100 node tests/routes.crawl.mjs   # against a prod build
```

## 3. `flows.browser.mjs` — the signed-in journeys

Drives Chromium through registration, the customer dashboard, saving an address,
the wishlist, adding to the basket, applying a coupon, checking out, and then the
admin console: the dashboard chart, every list page, an order status transition,
the product editor and the settings form. It fails the run on any browser console
error or unhandled page error, which is how the hydration mismatches were found.

```bash
npx playwright install chromium   # once
node tests/flows.browser.mjs
```

**Note on selectors:** fields are addressed by their `name` attribute, not by
label. Required fields render an asterisk inside the `<label>`, so the label's
text content is `Password*` and label-based locators are brittle.

## Prerequisites

The API's `CORS_ORIGINS` must include whatever origin the storefront is served
from. And because the suites make hundreds of requests from one address, running
them repeatedly will trip the rate limiter and produce a wall of 429s that looks
like a product failure. Start the API with both raised for a test session:

```bash
CORS_ORIGINS=http://localhost:4000,http://localhost:4100 \
RATE_LIMIT_MAX=5000 AUTH_RATE_LIMIT_MAX=200 \
npm run dev
```

Never do this in production — the limiter is what keeps credential stuffing and
scraping off the API.
