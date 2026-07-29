import Button from '@/components/ui/Button';
import Reveal from '@/components/motion/Reveal';
import WhatsAppLink from '@/components/shared/WhatsAppLink';
import { ROUTES, siteConfig } from '@/config/site';

/**
 * Closing call to action. Offers three ways to get in touch rather than one, so
 * whichever the visitor prefers is already on screen.
 */
export default function ContactCta() {
  return (
    <section className="container-page pb-20 lg:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-honey-500 via-honey-400 to-honey-300 px-6 py-14 text-center sm:px-12 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16v32L28 64 0 48V16z' fill='none' stroke='%232a1c16' stroke-width='2'/%3E%3C/svg%3E\")",
              backgroundSize: '56px 100px',
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            <span className="text-4xl" aria-hidden="true">
              🐝
            </span>

            <h2 className="mt-5 text-3xl font-semibold text-bark-900 sm:text-4xl">
              Not sure which honey is for you?
            </h2>

            <p className="mt-4 text-base text-bark-800/85 sm:text-lg">
              Tell us how you use honey — in tea, on toast, for a cough — and we will point you at
              the right jar. No sales pitch, just a beekeeper&apos;s opinion.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button href={ROUTES.contact} variant="secondary" size="lg">
                Message us
              </Button>
              <WhatsAppLink
                message={`Hello ${siteConfig.name}, I would like some help choosing a honey.`}
                className="inline-flex h-13 items-center justify-center rounded-[var(--radius-pill)] border border-bark-800/25 bg-white/80 px-8 text-base font-semibold text-bark-800 transition-colors hover:bg-white"
              >
                Chat on WhatsApp
              </WhatsAppLink>
            </div>

            <p className="mt-7 text-sm text-bark-800/75">
              Or call us on{' '}
              <a href={`tel:${siteConfig.contact.phone}`} className="font-semibold underline underline-offset-4">
                {siteConfig.contact.phone}
              </a>{' '}
              — 9am to 7pm, Monday to Saturday.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
