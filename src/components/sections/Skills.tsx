/**
 * Skills — categories of technical skills as scannable cards.
 * Content from content/site.ts. Grid: 1 col → md:2 → lg:3.
 */
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { skills } from '@content/site';

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Toolbox"
      title="Skills & Technologies"
      intro="The languages, frameworks, and tools I reach for most."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((group, i) => (
          <Reveal key={group.category} delay={i * 0.08} className="h-full">
            <div className="h-full rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
                <span aria-hidden className="h-4 w-1 rounded-full bg-gradient-to-b from-accent-strong to-cyan" />
                {group.category}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/50 hover:text-text"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
