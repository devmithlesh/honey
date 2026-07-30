# Honey Bee Farm — E-Commerce Platform

Production-oriented storefront and admin platform for a honey bee farming business.
Two independent applications share this repository; neither imports code from the
other, and they communicate strictly over REST.

```text
honey/
├── frontend/   Next.js 16 App Router storefront + admin UI (JavaScript, JSX)
└── backend/    Express 5 REST API (Sequelize ORM, PostgreSQL)
```

## Stack as actually installed

The build targets the versions resolved in each `package.json`, which differ from
the original brief in three places that change how code must be written:

| Area      | Installed          | Notes                                                                                                                          |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Next.js   | **16.2.10**        | `params`/`searchParams`/`cookies()`/`headers()` are async-only; `middleware` → `proxy`; Turbopack default; `next lint` removed  |
| React     | 19.2.4             | App Router runs the React canary bundled with Next                                                                              |
| Tailwind  | **v4**             | No `tailwind.config.js` — tokens live in `@theme` in `src/app/globals.css`                                                      |
| Express   | **5.2.1**          | path-to-regexp v8: no bare `'*'` routes; `req.query` is a read-only getter                                                      |
| Sequelize | 6.37.8 + **pg**    | CommonJS backend so `sequelize-cli` migrations run without ESM shims                                                            |
| Database  | **PostgreSQL**     | The brief said MySQL; the project was provisioned against Postgres and the code (JSONB, `iLike`, `::int` casts) targets it      |

## Prerequisites

- Node.js **20.9+**
- A reachable **PostgreSQL 14+** server. The backend validates its config at boot
  and refuses to start until `DATABASE_URL` (or the discrete `DB_*` values) in
  `backend/.env` points at a live instance.

## Setup

```bash
# Backend
cd backend
cp .env.example .env          # fill in DB_* and generate the three JWT secrets
npm install
npm run db:create             # creates the database
npm run db:migrate            # builds the schema
npm run db:seed               # roles, categories, products, settings, first admin
npm run dev                   # http://localhost:5000/api/v1

# Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:4000
```

Generate each JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The three secrets must differ from one another; the config validator rejects
reused or short values at startup.

The seeder creates the first administrator from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. **Change that password before deploying.**

## Health check

```bash
curl http://localhost:5000/api/v1/health
```

Reports process uptime and performs a real database round-trip, so an
unreachable database shows as `"database": "disconnected"` rather than a false
healthy result.

## Pages

### Storefront

| Route                          | What it does                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `/`                            | Hero, farm story, why-choose-us, featured products, benefits, process, testimonials, FAQ, newsletter, contact CTA |
| `/about`                       | Company story, mission, vision, values, milestones, the farm, the team             |
| `/shop`                        | Product grid with search, category, price, rating and stock filters, sorting, pagination |
| `/shop/[slug]`                 | Gallery, price, stock, tabs, reviews with a submission form, related products       |
| `/cart`                        | Quantity editing, removal, coupon entry, order summary                              |
| `/checkout`                    | Contact, delivery and billing addresses, COD or manual UPI, server-quoted totals     |
| `/order-success/[orderNumber]` | Order id, payment status, item summary, delivery details                            |
| `/contact`                     | Contact form, phone, email, WhatsApp, map, opening hours, social links               |
| `/faq`                         | Ten answered questions with FAQ structured data                                     |
| `/privacy-policy`, `/terms-conditions`, `/shipping-policy`, `/refund-policy` | Legal pages with a table of contents |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Credential flows                                  |
| any unmatched path             | Custom 404                                                                          |

### Customer account (`/account`, sign-in required)

Dashboard · My orders · Order detail with a fulfilment timeline · Saved addresses ·
Wishlist · My profile · Change password.

### Admin console (`/admin`, admin role required)

Dashboard (revenue, orders, customers, products, pending orders, low stock, a
14-day revenue chart, best sellers) · Orders with status transitions, payment
verification and a printable invoice · Products with multi-image upload ·
Categories · Customers · Review moderation · Coupons · Settings.

### Editing the content

Marketing copy — FAQs, team, milestones, contact reasons and all four policy
pages — lives in [`frontend/src/config/content.js`](frontend/src/config/content.js)
as plain strings, so wording can be rewritten without touching a component.
Business details (contact, shipping charges, UPI, SEO defaults) are edited from
**Admin → Settings** and stored in the database.

## Architecture

Requests flow in one direction only, and business logic never lives in a route
file:

```text
Routes → Middleware → Validators → Controllers → Services → Repositories → Models → PostgreSQL
```

- **Routes** declare paths and attach middleware.
- **Validators** are Joi schemas; every request body, query and param is validated.
- **Controllers** translate HTTP to service calls and produce the response envelope.
- **Services** hold business rules and own transactions.
- **Repositories** are the only layer that talks to Sequelize models.

### Response envelope

Every endpoint returns the same shape, success or failure:

```jsonc
// success
{ "success": true, "message": "Product created successfully", "data": {} }

// list endpoints add pagination metadata
{ "success": true, "message": "...", "data": [], "meta": { "pagination": {} } }

// failure
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "..." }] }
```

### Authentication

- Short-lived **access token** in memory only (never `localStorage`), so an XSS
  payload cannot read it from storage.
- **Refresh token** in an HTTP-only cookie, stored server-side as a SHA-256
  digest and rotated on every refresh. A replayed token fails the hash check and
  revokes the session.
- A password change invalidates every token issued before it.
- Role checks are re-read from the database on every request, so deactivating an
  account takes effect immediately rather than when the token expires.

### Money and stock

Prices are never taken from the request body. The cart is priced server-side from
the database on both `/orders/quote` and `/orders`, so a tampered client can
change *what* is bought but not the amount charged. Stock is claimed with a
conditional `UPDATE ... WHERE stock >= n` inside the order transaction, so two
simultaneous checkouts cannot oversell the last jar, and every movement is written
to an inventory ledger that reconciles against `products.stock`.

## Verification

Three suites in [`tests/`](tests/), all against a live stack rather than mocks:

```bash
node tests/api.smoke.mjs        # every API route group, including the rejections
node tests/routes.crawl.mjs     # every page renders the content it should
node tests/flows.browser.mjs    # signed-in customer and admin journeys in Chromium
```

See [`tests/README.md`](tests/README.md) for what each one covers and how to
point them at a production build.

### Known framework behaviour

An unknown product slug renders the 404 UI with `<meta name="robots" content="noindex">`
but returns HTTP 200. Next 16 streams App Router responses, so headers are already
sent by the time `notFound()` runs — this is documented in the framework's
`loading.js` status-codes note, and the noindex tag is what keeps the page out of
search results.

## Documentation

Detailed guides are added alongside the modules they describe:

- `docs/DATABASE.md` — schema and relationships
- `docs/API.md` — endpoint reference
- `docs/DEPLOYMENT.md` — production deployment guide
