import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { authApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { clearAccessToken, setAccessToken } from '@/lib/api/tokenStore';

/**
 * Session state.
 *
 * The access token itself is *not* kept here — Redux state is serialisable and
 * inspectable, so the token lives in module memory (`tokenStore`) instead. This
 * slice only tracks who is signed in and whether the session has been resolved.
 */
const initialState = {
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  isBootstrapped: false,
  error: null,
};

const rejectWithApiError = (thunkApi, error) =>
  thunkApi.rejectWithValue(parseApiError(error));

export const login = createAsyncThunk('auth/login', async (payload, thunkApi) => {
  try {
    const data = await authApi.login(payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (error) {
    return rejectWithApiError(thunkApi, error);
  }
});

export const register = createAsyncThunk('auth/register', async (payload, thunkApi) => {
  try {
    const data = await authApi.register(payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (error) {
    return rejectWithApiError(thunkApi, error);
  }
});

/**
 * Runs once on mount. The refresh cookie is HTTP-only, so the only way to know
 * whether a session survived a page reload is to ask the API.
 */
export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, thunkApi) => {
    try {
      const data = await authApi.refresh();
      setAccessToken(data.accessToken);
      return data.user;
    } catch {
      // No session is the normal case for a first-time visitor, not an error.
      clearAccessToken();
      return thunkApi.rejectWithValue(null);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } finally {
    clearAccessToken();
  }
});

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, thunkApi) => {
    try {
      const data = await authApi.changePassword(payload);
      setAccessToken(data.accessToken);
      return data.user;
    } catch (error) {
      return rejectWithApiError(thunkApi, error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called by the axios interceptor when a refresh finally fails.
    sessionExpired(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.isBootstrapped = true;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const authenticate = (state, action) => {
      state.user = action.payload;
      state.status = 'authenticated';
      state.isBootstrapped = true;
      state.error = null;
    };

    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, authenticate)
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload?.message || 'Sign in failed';
      })

      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, authenticate)
      .addCase(register.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload?.message || 'Registration failed';
      })

      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, authenticate)
      .addCase(bootstrapSession.rejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        state.isBootstrapped = true;
      })

      .addCase(changePassword.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        state.isBootstrapped = true;
      });
  },
});

export const { sessionExpired, setUser, clearError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;
