import Button from '@/components/ui/Button';
import { ROUTES } from '@/config/site';

export const metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="container-page flex min-h-dvh flex-col items-center justify-center py-24 text-center"
    >
      <p
        className="font-[family-name:var(--font-display)] text-[7rem] leading-none font-semibold text-honey-400 sm:text-[9rem]"
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">This page flew the hive</h1>
      <p className="mt-4 max-w-md text-bark-600">
        The page you are looking for has been moved or never existed. Let us get you back to
        something sweet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href={ROUTES.home}>Back to home</Button>
        <Button href={ROUTES.shop} variant="outline">
          Browse our honey
        </Button>
      </div>
    </main>
  );
}
