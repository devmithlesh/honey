/**
 * The access token lives in module memory only — never in localStorage or a
 * readable cookie, so an XSS payload cannot exfiltrate it by reading storage.
 *
 * Durability comes from the refresh token, which the API sets as an HTTP-only
 * cookie. On a full page load the app calls `/auth/refresh` to mint a new
 * access token and restore the session.
 */
let accessToken = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const clearAccessToken = () => {
  accessToken = null;
};
