import SectionHeading from './SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

const BENEFITS = [
  {
    icon: '🛡️',
    title: 'Supports immunity',
    body: 'Natural antioxidants and trace pollen help the body do what it already does well.',
  },
  {
    icon: '🌙',
    title: 'Soothes coughs',
    body: 'A spoon before bed coats an irritated throat — the oldest remedy there is.',
  },
  {
    icon: '⚡',
    title: 'Clean energy',
    body: 'Fructose and glucose the body absorbs steadily, without a refined-sugar crash.',
  },
  {
    icon: '🌿',
    title: 'Aids digestion',
    body: 'Prebiotic sugars feed the good bacteria that keep digestion comfortable.',
  },
  {
    icon: '✨',
    title: 'Skin and hair',
    body: 'A humectant that draws moisture in, which is why it turns up in so many masks.',
  },
  {
    icon: '🍵',
    title: 'A better sweetener',
    body: 'Swap it into tea, curd, porridge and bakes for flavour refined sugar cannot give.',
  },
];

export default function HoneyBenefits() {
  return (
    <section className="relative overflow-hidden bg-bark-900 py-20 text-cream-100 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16v32L28 64 0 48V16z' fill='none' stroke='%23fedf89' stroke-width='2'/%3E%3C/svg%3E\")",
          backgroundSize: '56px 100px',
        }}
      />

      <div className="container-page relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-honey-500/20 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-honey-300 uppercase">
            Honey benefits
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-cream-50 sm:text-4xl">
            One jar, a very long list of reasons
          </h2>
          <p className="mt-4 text-base text-bark-300 sm:text-lg">
            Raw honey keeps the enzymes, antioxidants and pollen that processing strips away.
          </p>
        </div>

        <RevealGroup className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <RevealItem key={benefit.title}>
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-honey-500/15 text-xl">
                  <span aria-hidden="true">{benefit.icon}</span>
                </span>
                <div>
                  <h3 className="text-base font-semibold text-cream-50">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-bark-300">{benefit.body}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-14 text-center text-xs text-bark-400">
          Traditional wellness information only — not medical advice. Honey is not suitable for
          infants under 12 months.
        </p>
      </div>
    </section>
  );
}
