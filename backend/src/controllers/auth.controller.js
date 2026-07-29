'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');
const { setRefreshCookie, clearRefreshCookie, readRefreshCookie } = require('../utils/cookies');

/**
 * Controllers stay thin: read the validated request, call one service, and
 * shape the HTTP response. The refresh token is moved into an HTTP-only cookie
 * here so it never appears in a JSON body the browser can read.
 */
const respondWithSession = (res, { user, accessToken, refreshToken }, message, created = false) => {
  setRefreshCookie(res, refreshToken);
  const body = { user, accessToken };
  return created
    ? ApiResponse.created(res, message, body)
    : ApiResponse.ok(res, message, body);
};

const register = asyncHandler(async (req, res) => {
  const session = await authService.register(req.body);
  return respondWithSession(res, session, 'Account created successfully', true);
});

const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body);
  return respondWithSession(res, session, 'Signed in successfully');
});

const refresh = asyncHandler(async (req, res) => {
  const session = await authService.refresh(readRefreshCookie(req));
  return respondWithSession(res, session, 'Session refreshed');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user?.id);
  clearRefreshCookie(res);
  return ApiResponse.ok(res, 'Signed out successfully', null);
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return ApiResponse.ok(res, 'Profile loaded', { user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Same response whether or not the address exists.
  return ApiResponse.ok(
    res,
    'If an account exists for that email, a reset link is on its way',
    null
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  clearRefreshCookie(res);
  return ApiResponse.ok(res, 'Password reset successfully. Please sign in.', null);
});

const changePassword = asyncHandler(async (req, res) => {
  const session = await authService.changePassword(req.user.id, req.body);
  return respondWithSession(res, session, 'Password updated successfully');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};
