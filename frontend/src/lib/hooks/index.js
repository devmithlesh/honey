'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { addItem, selectCartCount, selectCartItems } from '@/features/cart/cartSlice';
import { selectAuth, selectIsAdmin, selectIsAuthenticated } from '@/features/auth/authSlice';
import { parseApiError } from '@/lib/api/client';

/**
 * `false` while rendering on the server and during hydration, `true` afterwards.
 *
 * Anything that branches on state populated by an effect — the session, the
 * cart, the wishlist — must gate on this. React 19 hydrates in passes, so an
 * effect elsewhere in the tree can land before this subtree hydrates; without
 * the gate the first client render can disagree with the server HTML and React
 * throws away the tree with a hydration error.
 *
 * `useSyncExternalStore` is the supported way to express this: it is handed a
 * separate server snapshot, and React only switches to the client snapshot once
 * hydration is complete. A `useState` + `useEffect` flag cannot make that
 * guarantee.
 */
const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export const useIsHydrated = () =>
  useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);

/** Session state plus the two derived flags almost every consumer wants. */
export const useAuth = () => {
  const auth = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  return { ...auth, isAuthenticated, isAdmin };
};

/** Cart contents plus a toast-confirmed add, used from cards and detail pages. */
export const useCart = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const count = useSelector(selectCartCount);

  const add = useCallback(
    (product, quantity = 1) => {
      if (!product?.stock || product.stock < 1) {
        toast.error('This product is out of stock');
        return false;
      }
      dispatch(addItem({ product, quantity }));
      toast.success(`${product.name} added to your basket`);
      return true;
    },
    [dispatch]
  );

  return { items, count, add };
};

/**
 * Delays a fast-changing value (search box, price slider) so a keystroke does
 * not become an API call.
 */
export const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

/**
 * Data loader for client pages.
 *
 * Loading state is *derived* rather than stored: the settled result carries the
 * request key it belongs to, and anything else means a request is in flight.
 * That keeps every `setState` inside an async callback, so the effect never
 * triggers the cascading render that a synchronous `setIsLoading(true)` would.
 */
export const useAsyncData = (loader, dependencies = [], { enabled = true } = {}) => {
  const [settled, setSettled] = useState({ key: null, data: null, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  // Identifies the request the current dependency values ask for.
  const requestKey = `${JSON.stringify(dependencies)}::${reloadToken}`;

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    loader()
      .then((result) => {
        if (!cancelled) setSettled({ key: requestKey, data: result, error: null });
      })
      .catch((caught) => {
        if (!cancelled) setSettled({ key: requestKey, data: null, error: parseApiError(caught) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, enabled]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const isCurrent = settled.key === requestKey;

  return {
    data: isCurrent ? settled.data : null,
    error: isCurrent ? settled.error : null,
    isLoading: enabled && !isCurrent,
    reload,
    setData: (data) => setSettled({ key: requestKey, data, error: null }),
  };
};

/** Locks body scroll while a drawer or modal is open. */
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isLocked]);
};

/** Fires when a click lands outside the referenced element (dropdown dismiss). */
export const useClickOutside = (handler) => {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
};
