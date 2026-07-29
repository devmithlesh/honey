import SectionHeading from './SectionHeading';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

const REASONS = [
  {
    icon: '🧪',
    title: 'Lab-tested purity',
    body: 'Every batch is tested for added sugar, moisture and antibiotic residue before it is jarred.',
  },
  {
    icon: '❄️',
    title: 'Never heated',
    body: 'Cold extraction keeps the enzymes, pollen and aroma that pasteurisation destroys.',
  },
  {
    icon: '📍',
    title: 'Traceable to the hive',
    body: 'The batch code on your jar tells you which apiary and which week it came from.',
  },
  {
    icon: '🚚',
    title: 'Fast, careful delivery',
    body: 'Packed in cushioned boxes and dispatched within 24 hours across India.',
  },
  {
    icon: '♻️',
    title: 'Glass, not plastic',
    body: 'Reusable glass jars and plastic-free packaging on every single order.',
  },
  {
    icon: '💛',
    title: 'Fair to the bees',
    body: 'We leave enough honey in every hive for the colony to overwinter comfortably.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why choose us"
          title="Honey worth being fussy about"
          description="Most supermarket honey is blended, heated and cut with syrup. Ours is none of those things — and we can prove it."
        />

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <RevealItem key={reason.title}>
              <div className="group h-full rounded-[var(--radius-card)] border border-bark-100 bg-cream-50 p-6 transition-colors duration-300 hover:border-honey-200 hover:bg-honey-50">
                <span className="grid size-12 place-items-center rounded-2xl bg-honey-100 text-2xl transition-transform duration-300 group-hover:scale-110">
                  <span aria-hidden="true">{reason.icon}</span>
                </span>
                <h3 className="mt-5 text-base font-semibold text-bark-900">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bark-600">{reason.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
