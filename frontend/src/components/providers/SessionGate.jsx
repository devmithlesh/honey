'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { bootstrapSession, sessionExpired } from '@/features/auth/authSlice';
import { hydrateCart } from '@/features/cart/cartSlice';
import { setSessionExpiredHandler } from '@/lib/api/client';

/**
 * Runs the two pieces of client-only start-up work exactly once:
 *
 *  1. Restores the cart from localStorage (after mount, so server and client
 *     HTML match on the first paint).
 *  2. Asks the API whether the HTTP-only refresh cookie still represents a live
 *     session, which is the only way to know — the cookie is unreadable here.
 *
 * It also wires the axios interceptor's "refresh failed" hook into Redux so an
 * expired session clears the UI instead of leaving a stale signed-in header.
 */
export default function SessionGate({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    setSessionExpiredHandler(() => dispatch(sessionExpired()));
    dispatch(hydrateCart());
    dispatch(bootstrapSession());

    return () => setSessionExpiredHandler(null);
  }, [dispatch]);

  return children;
}
