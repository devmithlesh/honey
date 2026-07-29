import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isMobileNavOpen: false,
  isCartDrawerOpen: false,
  isSearchOpen: false,
};

/**
 * Ephemeral interface state that several unrelated components need to read or
 * toggle (header, drawers, overlays). Server data is never stored here.
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileNav(state, action) {
      state.isMobileNavOpen = action.payload ?? !state.isMobileNavOpen;
    },
    toggleCartDrawer(state, action) {
      state.isCartDrawerOpen = action.payload ?? !state.isCartDrawerOpen;
    },
    toggleSearch(state, action) {
      state.isSearchOpen = action.payload ?? !state.isSearchOpen;
    },
    closeAllOverlays(state) {
      state.isMobileNavOpen = false;
      state.isCartDrawerOpen = false;
      state.isSearchOpen = false;
    },
  },
});

export const { toggleMobileNav, toggleCartDrawer, toggleSearch, closeAllOverlays } =
  uiSlice.actions;

export const selectUi = (state) => state.ui;

export default uiSlice.reducer;
