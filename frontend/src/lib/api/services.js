import apiClient, { unwrap } from './client';

/**
 * Every browser-side call the app makes, grouped by domain.
 *
 * Components never talk to axios directly: they call one of these functions,
 * so an endpoint change is a one-line edit here rather than a hunt through the
 * component tree. Each function returns the unwrapped `data` payload.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then(unwrap),
  login: (payload) => apiClient.post('/auth/login', payload).then(unwrap),
  refresh: () => apiClient.post('/auth/refresh').then(unwrap),
  logout: () => apiClient.post('/auth/logout').then(unwrap),
  me: () => apiClient.get('/auth/me').then(unwrap),
  forgotPassword: (payload) => apiClient.post('/auth/forgot-password', payload).then(unwrap),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload).then(unwrap),
  changePassword: (payload) => apiClient.patch('/auth/change-password', payload).then(unwrap),
};

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
export const catalogApi = {
  // The list endpoint returns pagination in `meta`, so the full envelope is
  // handed back rather than just `data`.
  listProducts: (params) =>
    apiClient.get('/products', { params }).then((response) => ({
      products: response.data.data,
      pagination: response.data.meta?.pagination,
    })),
  featuredProducts: (limit = 8) =>
    apiClient.get('/products/featured', { params: { limit } }).then(unwrap),
  getProduct: (slug) => apiClient.get(`/products/${slug}`).then(unwrap),
  getRelated: (slug) => apiClient.get(`/products/${slug}/related`).then(unwrap),
  listReviews: (slug, params) =>
    apiClient.get(`/products/${slug}/reviews`, { params }).then((response) => ({
      reviews: response.data.data,
      pagination: response.data.meta?.pagination,
      breakdown: response.data.meta?.breakdown,
    })),
  createReview: (slug, payload) =>
    apiClient.post(`/products/${slug}/reviews`, payload).then(unwrap),
  listCategories: () => apiClient.get('/categories').then(unwrap),
  getSettings: () => apiClient.get('/settings').then(unwrap),
};

// ---------------------------------------------------------------------------
// Cart / checkout
// ---------------------------------------------------------------------------
export const checkoutApi = {
  validateCoupon: (payload) => apiClient.post('/coupons/validate', payload).then(unwrap),
  quote: (payload) => apiClient.post('/orders/quote', payload).then(unwrap),
  placeOrder: (payload) => apiClient.post('/orders', payload).then(unwrap),
  getOrder: (orderNumber) => apiClient.get(`/orders/${orderNumber}`).then(unwrap),
};

// ---------------------------------------------------------------------------
// Customer account
// ---------------------------------------------------------------------------
export const accountApi = {
  getProfile: () => apiClient.get('/users/me').then(unwrap),
  updateProfile: (payload) => apiClient.patch('/users/me', payload).then(unwrap),
  uploadAvatar: (formData) => apiClient.post('/users/me/avatar', formData).then(unwrap),
  getDashboard: () => apiClient.get('/users/me/dashboard').then(unwrap),

  listAddresses: () => apiClient.get('/users/me/addresses').then(unwrap),
  createAddress: (payload) => apiClient.post('/users/me/addresses', payload).then(unwrap),
  updateAddress: (id, payload) => apiClient.put(`/users/me/addresses/${id}`, payload).then(unwrap),
  setDefaultAddress: (id) => apiClient.patch(`/users/me/addresses/${id}/default`).then(unwrap),
  deleteAddress: (id) => apiClient.delete(`/users/me/addresses/${id}`).then(unwrap),

  listWishlist: () => apiClient.get('/users/me/wishlist').then(unwrap),
  toggleWishlist: (productId) =>
    apiClient.post('/users/me/wishlist/toggle', { productId }).then(unwrap),
  removeWishlist: (productId) => apiClient.delete(`/users/me/wishlist/${productId}`).then(unwrap),

  listOrders: (params) =>
    apiClient.get('/users/me/orders', { params }).then((response) => ({
      orders: response.data.data,
      pagination: response.data.meta?.pagination,
    })),
  cancelOrder: (orderNumber, reason) =>
    apiClient.post(`/users/me/orders/${orderNumber}/cancel`, { reason }).then(unwrap),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
const paged = (promise) =>
  promise.then((response) => ({
    rows: response.data.data,
    pagination: response.data.meta?.pagination,
  }));

export const adminApi = {
  dashboard: () => apiClient.get('/admin/dashboard').then(unwrap),

  listProducts: (params) => paged(apiClient.get('/admin/products', { params })),
  getProduct: (id) => apiClient.get(`/admin/products/${id}`).then(unwrap),
  // Product writes travel as multipart so new images ride along with the fields.
  createProduct: (formData) => apiClient.post('/admin/products', formData).then(unwrap),
  updateProduct: (id, formData) => apiClient.put(`/admin/products/${id}`, formData).then(unwrap),
  deleteProduct: (id) => apiClient.delete(`/admin/products/${id}`).then(unwrap),
  addProductImages: (id, formData) =>
    apiClient.post(`/admin/products/${id}/images`, formData).then(unwrap),
  deleteProductImage: (id, imageId) =>
    apiClient.delete(`/admin/products/${id}/images/${imageId}`).then(unwrap),
  setPrimaryImage: (id, imageId) =>
    apiClient.patch(`/admin/products/${id}/images/${imageId}/primary`).then(unwrap),

  listCategories: () => apiClient.get('/admin/categories').then(unwrap),
  createCategory: (payload) => apiClient.post('/admin/categories', payload).then(unwrap),
  updateCategory: (id, payload) => apiClient.put(`/admin/categories/${id}`, payload).then(unwrap),
  deleteCategory: (id) => apiClient.delete(`/admin/categories/${id}`).then(unwrap),

  listOrders: (params) => paged(apiClient.get('/admin/orders', { params })),
  getOrder: (id) => apiClient.get(`/admin/orders/${id}`).then(unwrap),
  getInvoice: (id) => apiClient.get(`/admin/orders/${id}/invoice`).then(unwrap),
  updateOrderStatus: (id, payload) =>
    apiClient.patch(`/admin/orders/${id}/status`, payload).then(unwrap),
  updateOrderPayment: (id, payload) =>
    apiClient.patch(`/admin/orders/${id}/payment`, payload).then(unwrap),

  listCustomers: (params) => paged(apiClient.get('/admin/customers', { params })),
  getCustomer: (id) => apiClient.get(`/admin/customers/${id}`).then(unwrap),
  setCustomerStatus: (id, isActive) =>
    apiClient.patch(`/admin/customers/${id}/status`, { isActive }).then(unwrap),

  listReviews: (params) => paged(apiClient.get('/admin/reviews', { params })),
  setReviewStatus: (id, payload) =>
    apiClient.patch(`/admin/reviews/${id}/status`, payload).then(unwrap),
  deleteReview: (id) => apiClient.delete(`/admin/reviews/${id}`).then(unwrap),

  listCoupons: (params) => paged(apiClient.get('/admin/coupons', { params })),
  createCoupon: (payload) => apiClient.post('/admin/coupons', payload).then(unwrap),
  updateCoupon: (id, payload) => apiClient.put(`/admin/coupons/${id}`, payload).then(unwrap),
  deleteCoupon: (id) => apiClient.delete(`/admin/coupons/${id}`).then(unwrap),

  getSettings: () => apiClient.get('/admin/settings').then(unwrap),
  updateSettings: (payload) => apiClient.put('/admin/settings', payload).then(unwrap),
  uploadSettingImage: (key, formData) =>
    apiClient.post(`/admin/settings/${key}/image`, formData).then(unwrap),
};
