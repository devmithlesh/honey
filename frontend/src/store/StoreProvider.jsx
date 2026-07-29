'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';

import { makeStore } from './index';

/**
 * Creates the Redux store once per client mount and hands it to react-redux.
 *
 * `useState` with a lazy initialiser (not a module-level singleton) keeps each
 * server render isolated — a singleton would leak one user's state into
 * another's request. A ref would work too, but reading `ref.current` during
 * render violates the React Compiler's rules of refs.
 */
export default function StoreProvider({ children }) {
  const [store] = useState(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
