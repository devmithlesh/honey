'use strict';

const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'hb_refresh_token';

/** `7d`, `15m`, `30s` -> milliseconds, for the cookie's `maxAge`. */
const durationToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number.parseInt(match[1], 10);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return amount * unit;
};

const baseOptions = () => ({
  httpOnly: true,
  secure: env.security.cookieSecure,
  sameSite: env.security.cookieSameSite,
  domain: env.security.cookieDomain,
  // Scoped to the whole API so `/auth/refresh` and `/auth/logout` both see it.
  path: '/',
});

/**
 * The refresh token only ever lives in an HTTP-only cookie — it is never part
 * of a JSON body, so no script running in the page can read it.
 */
const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: durationToMs(env.jwt.refreshExpiresIn),
  });
};

const clearRefreshCookie = (res) => {
  // Attributes must match the ones used when setting, or the browser keeps it.
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions());
};

const readRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE_NAME] || null;

module.exports = {
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
  durationToMs,
};
