'use client';

import { Toaster } from 'react-hot-toast';

import SessionGate from '@/components/providers/SessionGate';
import StoreProvider from '@/store/StoreProvider';

/**
 * Client-side context that must wrap the whole tree.
 *
 * Kept as a thin boundary imported by the server-rendered root layout, so the
 * layout itself stays a Server Component and pages can remain server-rendered.
 */
export default function Providers({ children }) {
  return (
    <StoreProvider>
      <SessionGate>{children}</SessionGate>
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-bark-900)',
            color: 'var(--color-cream-50)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: 'var(--color-leaf-400)', secondary: '#ffffff' } },
          error: { iconTheme: { primary: 'var(--color-danger)', secondary: '#ffffff' } },
        }}
      />
    </StoreProvider>
  );
}
