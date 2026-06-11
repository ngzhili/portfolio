/**
 * About — bio paragraphs and quick stats.
 * Content from content/site.ts.
 * (The résumé download button is intentionally hidden — re-add a <Button> here
 *  using resumePath + withBasePath if you want to bring it back.)
 */
import { Section } from '@/components/layout/Section';
import { CountUp } from '@/components/ui/CountUp';
import { Reveal } from '@/components/ui/Reveal';
import { about, site } from '@content/site';

export function About() {
  return (
    <Section id="about" eyebrow="About" title="A bit about me">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        {/* Bio */}
        <Reveal>
          <div className="space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            {about.bio.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Reveal>

        {/* Stats card */}
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
            <p className="text-sm text-faint">Based in {site.location}</p>
            <dl className="mt-6 grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-6">
              {about.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="order-2 text-xs text-faint sm:text-sm">{stat.label}</dt>
                  <dd className="order-1 font-display text-3xl font-bold text-gradient sm:text-4xl">
                    <CountUp value={stat.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
