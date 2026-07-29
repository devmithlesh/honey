import Link from 'next/link';

import { ROUTES, siteConfig } from '@/config/site';

const HIGHLIGHTS = [
  'Track every order from dispatch to doorstep',
  'Save addresses so checkout takes seconds',
  'Keep a wishlist of the jars you want next',
  'Review the honey you have actually bought',
];

/**
 * Split layout for the credential pages.
 *
 * The marketing panel is hidden below `lg` so a phone shows the form alone —
 * on a small screen the panel would push the fields below the fold.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-bark-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16v32L28 64 0 48V16z' fill='none' stroke='%23fedf89' stroke-width='2'/%3E%3C/svg%3E\")",
            backgroundSize: '56px 100px',
          }}
        />

        <Link href={ROUTES.home} className="relative flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-honey-400 text-lg" aria-hidden="true">
            🐝
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-cream-50">
            {siteConfig.name}
          </span>
        </Link>

        <div className="relative">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-cream-50">
            Raw honey, straight from our hives
          </h2>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-bark-200">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-honey-500/20 text-[10px] text-honey-300">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-bark-400">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>

      <div className="flex flex-col">
        <header className="p-6 lg:hidden">
          <Link href={ROUTES.home} className="inline-flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-honey-400" aria-hidden="true">
              🐝
            </span>
            <span className="font-[family-name:var(--font-display)] font-semibold text-bark-900">
              {siteConfig.name}
            </span>
          </Link>
        </header>

        <main id="main-content" className="flex flex-1 items-center justify-center px-6 py-10 lg:py-16">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
