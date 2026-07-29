# API Reference

Base URL: `http://localhost:5000/api/v1` (set by `API_PREFIX`).

Every response uses the same envelope:

```jsonc
{ "success": true,  "message": "...", "data": {}, "meta": { "pagination": {} } }
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

## Authentication

The access token goes in `Authorization: Bearer <token>`. The refresh token is set
as an HTTP-only cookie (`hb_refresh_token`) and is never returned in a body.

| Access                | Meaning                                        |
| --------------------- | ---------------------------------------------- |
| **Public**            | No token needed                                |
| **Optional**          | Works signed in or as a guest; behaviour differs |
| **Customer**          | Any signed-in account                          |
| **Admin**             | Signed in with the `admin` role                |

---

## Auth — `/auth`

| Method  | Path                | Access   | Notes                                                        |
| ------- | ------------------- | -------- | ------------------------------------------------------------ |
| `POST`  | `/register`         | Public   | Always creates a `customer`; the role can never be chosen by the client. Rate limited. |
| `POST`  | `/login`            | Public   | Rate limited per IP + email. One generic message for both failure branches. |
| `POST`  | `/refresh`          | Public   | Reads the cookie, rotates the pair. A replayed token revokes the session. |
| `POST`  | `/logout`           | Customer | Clears the stored refresh hash and the cookie.               |
| `GET`   | `/me`               | Customer | Current profile.                                             |
| `POST`  | `/forgot-password`  | Public   | Same response whether or not the account exists.             |
| `POST`  | `/reset-password`   | Public   | Token embeds a password fingerprint, so a link works once.    |
| `PATCH` | `/change-password`  | Customer | Issues a fresh pair so the caller stays signed in.           |

---

## Catalogue

### Products — `/products`

| Method | Path               | Access   | Notes                                        |
| ------ | ------------------ | -------- | -------------------------------------------- |
| `GET`  | `/`                | Public   | Filter, sort and paginate (see below).       |
| `GET`  | `/featured`        | Public   | `?limit=` (default 8).                       |
| `GET`  | `/:slug`           | Public   | Product + related items + rating histogram.  |
| `GET`  | `/:slug/related`   | Public   | Four neighbours from the same category.      |
| `GET`  | `/:slug/reviews`   | Public   | Approved reviews only, paginated.            |
| `POST` | `/:slug/reviews`   | Customer | One review per customer per product; starts unapproved. |

**List query parameters**

| Name        | Type    | Notes                                                     |
| ----------- | ------- | --------------------------------------------------------- |
| `page`      | number  | Default 1                                                 |
| `limit`     | number  | Default 12, max 100                                       |
| `search`    | string  | Matches name, descriptions and SKU                        |
| `category`  | slug    | Category slug                                             |
| `minPrice`  | number  | Compared against the **effective** (discounted) price      |
| `maxPrice`  | number  | May be sent on its own                                    |
| `minRating` | 1–5     |                                                           |
| `inStock`   | boolean |                                                           |
| `sort`      | enum    | `newest`, `oldest`, `price-asc`, `price-desc`, `name-asc`, `name-desc`, `rating`, `popular` |

### Categories — `/categories`

| Method | Path     | Access | Notes                              |
| ------ | -------- | ------ | ---------------------------------- |
| `GET`  | `/`      | Public | Active categories with product counts |
| `GET`  | `/:slug` | Public |                                    |

### Settings — `/settings`

| Method | Path | Access | Notes                                     |
| ------ | ---- | ------ | ----------------------------------------- |
| `GET`  | `/`  | Public | Only `is_public` keys, cast to their type |

---

## Checkout

### Coupons — `/coupons`

| Method | Path        | Access   | Notes                                                    |
| ------ | ----------- | -------- | -------------------------------------------------------- |
| `POST` | `/validate` | Optional | `{ code, subtotal }`. Signed in, the per-customer limit applies. Coupons are never listed publicly. |

### Orders — `/orders`

| Method | Path             | Access   | Notes                                                       |
| ------ | ---------------- | -------- | ----------------------------------------------------------- |
| `POST` | `/quote`         | Optional | Prices the cart server-side. Writes nothing.                |
| `POST` | `/`              | Optional | Places the order. Guests are allowed; a session attaches it to the account. |
| `GET`  | `/:orderNumber`  | Optional | Guest orders resolve by their unguessable number; owned orders require the owner or an admin. |

`POST /orders` body: `items[]`, `customerName`, `customerEmail`, `customerPhone`,
`shippingAddress`, optional `billingAddress`, `paymentMethod` (`cod` | `upi`),
`transactionReference` (required for UPI), `couponCode`, `customerNote`.

---

## Customer — `/users/me` (all Customer)

| Method   | Path                            | Notes                             |
| -------- | ------------------------------- | --------------------------------- |
| `GET`    | `/users/me`                     | Profile                           |
| `PATCH`  | `/users/me`                     | Name, email, phone only           |
| `POST`   | `/users/me/avatar`              | `multipart/form-data`, field `avatar` |
| `GET`    | `/users/me/dashboard`           | Summary + five recent orders      |
| `GET`    | `/users/me/addresses`           |                                   |
| `POST`   | `/users/me/addresses`           | Max 10 per customer               |
| `PUT`    | `/users/me/addresses/:id`       |                                   |
| `PATCH`  | `/users/me/addresses/:id/default` |                                 |
| `DELETE` | `/users/me/addresses/:id`       | Promotes another default          |
| `GET`    | `/users/me/wishlist`            |                                   |
| `POST`   | `/users/me/wishlist`            | Idempotent                        |
| `POST`   | `/users/me/wishlist/toggle`     | Returns `{ saved, products }`     |
| `DELETE` | `/users/me/wishlist/:productId` |                                   |
| `GET`    | `/users/me/orders`              | Paginated, `?status=`             |
| `POST`   | `/users/me/orders/:orderNumber/cancel` | Only while pending or confirmed; restores stock |

---

## Admin — `/admin` (all Admin)

| Method   | Path                                         | Notes                                          |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| `GET`    | `/dashboard`                                 | Cards, status split, 14-day revenue, best sellers, low stock |
| `GET`    | `/notifications`                             | Admin feed                                     |
| `PATCH`  | `/notifications/:id/read`, `/notifications/read-all` |                                        |
| `GET`    | `/products`                                  | Includes inactive; `?lowStock=true`            |
| `GET`    | `/products/:id`                              |                                                |
| `POST`   | `/products`                                  | `multipart/form-data`, field `images` (up to 6) |
| `PUT`    | `/products/:id`                              | Stock changes write an inventory movement       |
| `DELETE` | `/products/:id`                              | Soft delete; order history is preserved         |
| `POST`   | `/products/:id/images`                       |                                                |
| `PATCH`  | `/products/:id/images/:imageId/primary`      |                                                |
| `DELETE` | `/products/:id/images/:imageId`              | Promotes the next image if the primary is removed |
| `GET`    | `/categories`, `/categories/:id`             |                                                |
| `POST`   | `/categories`                                | `multipart/form-data`, field `image`           |
| `PUT`    | `/categories/:id`                            |                                                |
| `DELETE` | `/categories/:id`                            | Rejected while it still holds products (409)   |
| `GET`    | `/orders`                                    | `?status=`, `?search=`, `?from=`, `?to=`       |
| `GET`    | `/orders/:id`, `/orders/:id/invoice`         |                                                |
| `PATCH`  | `/orders/:id/status`                         | Forward transitions only; cancelling restores stock |
| `PATCH`  | `/orders/:id/payment`                        |                                                |
| `GET`    | `/customers`, `/customers/:id`               |                                                |
| `PATCH`  | `/customers/:id/status`                      | Deactivating also ends the live session         |
| `GET`    | `/reviews`                                   | `?status=pending`                              |
| `PATCH`  | `/reviews/:id/status`                        | Recomputes the product rating                   |
| `DELETE` | `/reviews/:id`                               |                                                |
| `GET`    | `/coupons`, `/coupons/:id`                   |                                                |
| `POST`   | `/coupons`, `PUT /coupons/:id`, `DELETE /coupons/:id` |                                       |
| `GET`    | `/settings`                                  | All keys, grouped                              |
| `PUT`    | `/settings`                                  | Batch upsert                                   |
| `POST`   | `/settings/:key/image`                       | `site_logo_url`, `upi_qr_url`, `og_image_url` only |

---

## Order status flow

```text
pending → confirmed → packed → shipped → delivered
   └──────────┴─────────┴────────┴──→ cancelled
```

`delivered` and `cancelled` are terminal. Cancelling returns stock to the shelf
and writes a reversing inventory movement. Delivering a COD order marks its
payment paid.

## Status codes

| Code | Used for                                            |
| ---- | --------------------------------------------------- |
| 200  | Success                                             |
| 201  | Created                                             |
| 400  | Business-rule rejection (expired coupon, illegal transition) |
| 401  | Missing, invalid or expired credentials             |
| 403  | Authenticated but not permitted                     |
| 404  | Not found                                           |
| 409  | Conflict (duplicate email or SKU, out of stock)     |
| 422  | Request validation failed — `errors[]` names each field |
| 429  | Rate limited                                        |
| 503  | Database unreachable                                |
