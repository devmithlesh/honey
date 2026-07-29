import PageHero from '@/components/shared/PageHero';
import SectionHeading from '@/components/home/SectionHeading';
import ContactCta from '@/components/home/ContactCta';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { MILESTONES, TEAM } from '@/config/content';
import { ROUTES, siteConfig } from '@/config/site';

export const metadata = {
  title: 'About our farm',
  description:
    'Three generations of beekeepers, forty hives at the edge of a protected forest, and one standard we have never lowered. Meet the family behind the honey.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: `About ${siteConfig.name}`,
    description:
      'Three generations of beekeepers, forty hives at the edge of a protected forest, and one standard we have never lowered.',
    url: '/about',
  },
};

const VALUES = [
  {
    icon: '🐝',
    title: 'The bees come first',
    body: 'We take only the surplus and always leave a colony enough honey to overwinter. A hive we exhaust is a hive we lose.',
  },
  {
    icon: '🔬',
    title: 'Proof over promises',
    body: 'Anybody can print "pure" on a label. We test every batch and put the batch code on the jar so you can check ours.',
  },
  {
    icon: '🤝',
    title: 'Straight dealing',
    body: 'Honest weights, honest descriptions and a price that reflects what the work actually costs.',
  },
];

/**
 * About page — company story, mission, vision, the farm, and the team.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Three generations, one valley and a great many bees"
        description="We are a family apiary in the Uttarakhand foothills. This is how we got here and why we still do it the slow way."
        breadcrumbs={[{ label: 'About' }]}
      />

      {/* ----- Story ----- */}
      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Reveal>
            <h2 className="text-2xl font-semibold sm:text-3xl">How it started</h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-bark-600">
              <p>
                In 1998 my grandfather kept four hives behind the house, mostly because he liked
                watching them. What he did not like was what happened to honey once it left a farm:
                heated until it poured like syrup, blended until it tasted of nothing, and sold as
                though those were improvements.
              </p>
              <p>
                So he sold his honey himself, in whatever jars he could find, to whoever would
                listen. It crystallised on the shelf and people brought it back thinking it had gone
                bad. He explained, every single time, that solid honey is the only kind that was
                never cooked.
              </p>
              <p>
                Twenty-eight years later there are forty hives instead of four, and a small
                laboratory where there used to be a shed. The explanation has not changed and neither
                has the honey.
              </p>
            </div>
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[var(--radius-card)] bg-honey-50 p-6">
                <h3 className="text-sm font-semibold tracking-wide text-honey-800 uppercase">
                  Our mission
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-bark-700">
                  To put genuinely raw honey within reach of anyone who wants it — traceable to the
                  hive, tested for purity, and priced so that buying honestly does not have to be a
                  luxury.
                </p>
              </div>

              <div className="rounded-[var(--radius-card)] bg-leaf-50 p-6">
                <h3 className="text-sm font-semibold tracking-wide text-leaf-800 uppercase">
                  Our vision
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-bark-700">
                  A market where &ldquo;raw&rdquo; means something because it is verified, and
                  where the beekeepers doing it properly can make a living from it.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----- Values ----- */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we stand for"
            title="Three rules we do not bend"
            description="Everything else about the business has changed over the years. These have not."
          />

          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <RevealItem key={value.title}>
                <div className="h-full rounded-[var(--radius-card)] border border-bark-100 bg-cream-50 p-7">
                  <span className="grid size-12 place-items-center rounded-2xl bg-honey-100 text-2xl">
                    <span aria-hidden="true">{value.icon}</span>
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-bark-900">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-bark-600">{value.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ----- Timeline ----- */}
      <section className="container-page py-16 lg:py-24">
        <SectionHeading
          eyebrow="Milestones"
          title="Twenty-eight years, five turning points"
        />

        <div className="relative mx-auto mt-14 max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[15px] w-0.5 bg-gradient-to-b from-honey-300 to-honey-100"
          />

          <ol className="space-y-8">
            {MILESTONES.map((milestone, index) => (
              <Reveal as="li" key={milestone.year} delay={index * 0.06} className="relative flex gap-6">
                <span className="z-10 mt-1 grid size-8 shrink-0 place-items-center rounded-full border-4 border-cream-100 bg-honey-500">
                  <span className="sr-only">{milestone.year}</span>
                </span>

                <div className="flex-1 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-honey-700">
                    {milestone.year}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-bark-900">{milestone.title}</h3>
                  <p className="mt-1 text-sm text-bark-600">{milestone.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ----- The farm ----- */}
      <section className="bg-bark-900 py-16 text-cream-100 lg:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-honey-500/20 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-honey-300 uppercase">
              The farm
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-cream-50 sm:text-4xl">
              Where the honey actually comes from
            </h2>
            <p className="mt-4 text-base text-bark-300">
              Twelve acres at the forest boundary, 1,400 metres up, with the hives moved four times a
              year to follow the blossom.
            </p>
          </div>

          <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: '🏔️', title: 'The valley', body: '1,400 m up, clean air and cold nights.' },
              { emoji: '🌳', title: 'The forest', body: 'Protected woodland with no spraying for miles.' },
              { emoji: '🏠', title: 'The apiary', body: 'Forty colonies in hand-built wooden hives.' },
              { emoji: '🔬', title: 'The lab', body: 'Where every batch is checked before jarring.' },
            ].map((tile) => (
              <RevealItem key={tile.title}>
                <div className="flex h-full flex-col justify-end rounded-[var(--radius-card)] bg-gradient-to-br from-bark-800 to-bark-700 p-6 lg:aspect-[4/5]">
                  <span className="text-3xl" aria-hidden="true">
                    {tile.emoji}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-cream-50">{tile.title}</h3>
                  <p className="mt-1.5 text-sm text-bark-300">{tile.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ----- Team ----- */}
      <section className="container-page py-16 lg:py-24">
        <SectionHeading
          eyebrow="The team"
          title="Meet the beekeepers"
          description="Four people, forty hives and roughly two million bees. The bees do most of the work."
        />

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member) => (
            <RevealItem key={member.name}>
              <div className="h-full rounded-[var(--radius-card)] border border-bark-100 bg-white p-6 text-center transition-shadow duration-300 hover:shadow-[var(--shadow-lifted)]">
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-honey-100 text-4xl">
                  <span aria-hidden="true">{member.emoji}</span>
                </span>
                <h3 className="mt-5 text-base font-semibold text-bark-900">{member.name}</h3>
                <p className="mt-0.5 text-xs font-medium text-honey-700">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-bark-600">{member.bio}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-14 text-center">
          <p className="text-base text-bark-600">
            Want to see it for yourself? We run farm visits by appointment.
          </p>
          <a
            href={ROUTES.contact}
            className="mt-4 inline-flex h-11 items-center rounded-[var(--radius-pill)] bg-honey-500 px-7 text-sm font-semibold text-bark-900 transition-colors hover:bg-honey-400"
          >
            Arrange a visit
          </a>
        </Reveal>
      </section>

      <ContactCta />
    </>
  );
}
