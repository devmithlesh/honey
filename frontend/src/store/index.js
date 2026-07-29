import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice';
import wishlistReducer from '@/features/wishlist/wishlistSlice';
import uiReducer from '@/features/ui/uiSlice';

/**
 * The store is created per request/mount rather than as a module singleton:
 * a singleton would be shared across users when Next.js renders on the server.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      ui: uiReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });
