import Button from '@/components/ui/Button';
import Reveal from '@/components/motion/Reveal';
import { ROUTES } from '@/config/site';

const HIGHLIGHTS = [
  {
    title: 'Family-run since 1998',
    body: 'Three generations of beekeepers tending the same valley, the same way.',
  },
  {
    title: 'Hives, not factories',
    body: 'We keep 40 colonies and harvest only the surplus the bees can spare.',
  },
  {
    title: 'Nothing added, nothing removed',
    body: 'No heating, no blending, no corn syrup. Just honey, strained and jarred.',
  },
];

/**
 * "About our farm" band on the home page — a short version of the story that
 * links through to the full About page.
 */
export default function AboutFarm() {
  return (
    <section className="container-page py-20 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal direction="right">
          <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-leaf-100 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-leaf-800 uppercase">
            Our farm
          </span>

          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            A small valley, forty hives and a very patient family
          </h2>

          <p className="mt-5 text-base leading-relaxed text-bark-600">
            Our apiary sits at the edge of a protected forest, far from farmland spraying and city
            air. The bees forage on wild blossom, mustard fields and mountain herbs, and we move the
            hives with the seasons so each harvest carries the character of where it was made.
          </p>

          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-honey-100 text-sm text-honey-700">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-semibold text-bark-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-bark-600">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <Button href={ROUTES.about} variant="outline" className="mt-9">
            Read our full story
          </Button>
        </Reveal>

        <Reveal direction="left" delay={0.1}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <StoryTile emoji="🐝" title="The colony" body="Healthy bees make honest honey." className="aspect-[4/5]" />
              <StoryTile emoji="🌼" title="The forage" body="Wild blossom, never monoculture." className="aspect-square" />
            </div>
            <div className="space-y-4 pt-8">
              <StoryTile emoji="🍯" title="The harvest" body="Cold-extracted in small batches." className="aspect-square" />
              <StoryTile emoji="🫙" title="The jar" body="Sealed within days of extraction." className="aspect-[4/5]" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StoryTile({ emoji, title, body, className }) {
  return (
    <div
      className={`flex flex-col justify-end rounded-[var(--radius-card)] bg-gradient-to-br from-honey-100 to-cream-200 p-5 shadow-[var(--shadow-soft)] ${className}`}
    >
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="mt-3 text-sm font-semibold text-bark-900">{title}</p>
      <p className="mt-1 text-xs text-bark-600">{body}</p>
    </div>
  );
}
