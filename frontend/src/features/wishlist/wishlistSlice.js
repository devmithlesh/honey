import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { accountApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';

/**
 * The wishlist is server-owned (it belongs to an account), so this slice is a
 * cache of the API rather than a source of truth. Guests have an empty list and
 * are prompted to sign in.
 */
const initialState = {
  products: [],
  status: 'idle',
  error: null,
};

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, thunkApi) => {
  try {
    return await accountApi.listWishlist();
  } catch (error) {
    return thunkApi.rejectWithValue(parseApiError(error));
  }
});

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async (productId, thunkApi) => {
    try {
      return await accountApi.toggleWishlist(productId);
    } catch (error) {
      return thunkApi.rejectWithValue(parseApiError(error));
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId, thunkApi) => {
    try {
      return await accountApi.removeWishlist(productId);
    } catch (error) {
      return thunkApi.rejectWithValue(parseApiError(error));
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist(state) {
      state.products = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.products = action.payload || [];
        state.status = 'succeeded';
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || null;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.products = action.payload?.products || [];
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.products = action.payload || [];
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;

export const selectWishlist = (state) => state.wishlist.products;
export const selectWishlistCount = (state) => state.wishlist.products.length;
export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.products.some((product) => String(product.id) === String(productId));

export default wishlistSlice.reducer;
