import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'hb_cart_v1';

/**
 * The cart lives entirely on the client until checkout.
 *
 * Line items store a snapshot of the product for rendering, but the price the
 * customer is actually charged is always recomputed by the API from the
 * database — the snapshot is display data, never the source of truth.
 */
const readStoredCart = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persist = (items) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // A full or disabled storage quota must not break the cart itself.
  }
};

const MAX_QUANTITY_PER_LINE = 99;

const initialState = {
  items: [],
  coupon: null,
  // Server-calculated totals, refreshed from `/orders/quote` at checkout.
  quote: null,
  isHydrated: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Reads localStorage after mount rather than in the initial state, so the
     * server-rendered HTML and the first client render agree (no hydration
     * mismatch) and the cart appears immediately afterwards.
     */
    hydrateCart(state) {
      state.items = readStoredCart();
      state.isHydrated = true;
    },

    addItem(state, action) {
      const { product, quantity = 1 } = action.payload;
      const productId = String(product.id);
      const existing = state.items.find((item) => item.productId === productId);

      const stock = Number(product.stock ?? MAX_QUANTITY_PER_LINE);
      const ceiling = Math.min(stock, MAX_QUANTITY_PER_LINE);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, ceiling);
      } else {
        state.items.push({
          productId,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0]?.url || null,
          weight: product.weight || null,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          stock,
          quantity: Math.min(quantity, ceiling),
        });
      }

      state.quote = null;
      persist(state.items);
    },

    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find((entry) => entry.productId === String(productId));
      if (!item) return;

      const ceiling = Math.min(item.stock || MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE);
      item.quantity = Math.max(1, Math.min(quantity, ceiling));

      state.quote = null;
      persist(state.items);
    },

    removeItem(state, action) {
      state.items = state.items.filter((item) => item.productId !== String(action.payload));
      if (state.items.length === 0) state.coupon = null;
      state.quote = null;
      persist(state.items);
    },

    clearCart(state) {
      state.items = [];
      state.coupon = null;
      state.quote = null;
      persist(state.items);
    },

    applyCoupon(state, action) {
      state.coupon = action.payload;
    },

    removeCoupon(state) {
      state.coupon = null;
      state.quote = null;
    },

    setQuote(state, action) {
      state.quote = action.payload;
    },
  },
});

export const {
  hydrateCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  setQuote,
} = cartSlice.actions;

const effectivePrice = (item) =>
  item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price
    ? item.discountPrice
    : item.price;

export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartCoupon = (state) => state.cart.coupon;
export const selectCartQuote = (state) => state.cart.quote;

export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

/** Client-side estimate used for badges and the cart page before checkout. */
export const selectCartSubtotal = (state) =>
  Math.round(
    state.cart.items.reduce((total, item) => total + effectivePrice(item) * item.quantity, 0) * 100
  ) / 100;

export const selectCartLineTotal = (item) =>
  Math.round(effectivePrice(item) * item.quantity * 100) / 100;

export const selectIsInCart = (productId) => (state) =>
  state.cart.items.some((item) => item.productId === String(productId));

export default cartSlice.reducer;
