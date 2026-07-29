import NewsletterForm from '@/components/layout/NewsletterForm';
import Reveal from '@/components/motion/Reveal';

/**
 * Standalone newsletter band. Reuses the footer's form component so the
 * validation and success behaviour stay identical in both places.
 */
export default function NewsletterBand() {
  return (
    <section className="container-page pb-20 lg:pb-24">
      <Reveal>
        <div className="grid items-center gap-8 rounded-[var(--radius-card)] bg-bark-900 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:py-14">
          <div>
            <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-honey-500/20 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-honey-300 uppercase">
              Newsletter
            </span>

            <h2 className="mt-4 text-2xl font-semibold text-cream-50 sm:text-3xl">
              Know when the next harvest lands
            </h2>

            <p className="mt-3 text-sm text-bark-300 sm:text-base">
              A short note a few times a year — what the bees have been on, what is back in stock,
              and the occasional subscriber-only offer.
            </p>
          </div>

          <div className="lg:pl-8">
            <NewsletterForm />
            <p className="mt-3 text-xs text-bark-400">
              Unsubscribe in one click. We never share your address.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
