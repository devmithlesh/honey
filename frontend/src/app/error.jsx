'use client';

import { useEffect } from 'react';

import Button from '@/components/ui/Button';

/**
 * Route-level error boundary. Receives the thrown error plus a `reset` callback
 * that re-renders the segment without a full page reload.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Replace with a real reporting sink (Sentry, Logtail) before launch.
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="container-page flex min-h-dvh flex-col items-center justify-center py-24 text-center"
    >
      <span className="text-5xl" aria-hidden="true">
        🐝
      </span>
      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-bark-600">
        Our hive hit an unexpected snag while loading this page. Please try again — if it keeps
        happening, get in touch and we will sort it out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    </main>
  );
}
