/**
 * AgentSystems — the featured GenAI agent work, right after the hero.
 * Content from `agentSystems` in content/site.ts. Grid: 1 col → lg:3, with the
 * featured entry spanning the full row and showing its stack layers as chips.
 */
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Tag } from '@/components/ui/Tag';
import { agentSystems } from '@content/site';

export function AgentSystems() {
  return (
    <Section
      id="agent-systems"
      eyebrow="GenAI Agents"
      title="Agent systems I've architected"
      intro="Production work at DSO National Laboratories: the platform and the agents that run on it."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {agentSystems.map((sys, i) => (
          <Reveal
            key={sys.title}
            delay={sys.featured ? 0 : ((i - 1) % 3) * 0.08}
            className={`h-full ${sys.featured ? 'lg:col-span-3' : ''}`}
          >
            <article
              className={`flex h-full flex-col rounded-2xl border bg-surface/60 p-6 transition-all duration-[calc(var(--m-dur)*1.5)] ease-[var(--m-ease)] hover:translate-y-[var(--m-lift-card)] hover:border-accent/50 sm:p-8 ${
                sys.featured ? 'border-accent/30' : 'border-border'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <p className="font-mono text-xs text-cyan">
                    {String(i + 1).padStart(2, '0')}
                    {sys.featured && <span className="text-faint"> &middot; platform</span>}
                  </p>
                  <h3
                    className={`mt-2 font-semibold text-text ${
                      sys.featured ? 'text-xl sm:text-2xl' : 'text-xl'
                    }`}
                  >
                    {sys.title}
                  </h3>
                  {/* Smaller cards carry their metric under the title. */}
                  {sys.metric && !sys.featured && (
                    <p className="mt-2 text-sm">
                      <span className="font-display font-bold text-gradient">
                        {sys.metric.value}
                      </span>{' '}
                      <span className="text-faint">{sys.metric.label}</span>
                    </p>
                  )}
                </div>
                {sys.metric && sys.featured && (
                  <div className="shrink-0 sm:text-right">
                    <p className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                      {sys.metric.value}
                    </p>
                    <p className="text-xs text-faint">{sys.metric.label}</p>
                  </div>
                )}
              </div>

              <p className="mt-3 text-base leading-relaxed text-muted">{sys.summary}</p>

              {sys.layers && (
                <ul aria-label="Stack layers" className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                  {sys.layers.map((layer) => (
                    <li
                      key={layer}
                      className="rounded-md border border-cyan/30 bg-cyan/5 px-2 py-1 text-cyan"
                    >
                      {layer}
                    </li>
                  ))}
                </ul>
              )}

              <ul
                className={`mt-5 flex-1 space-y-2 text-sm leading-relaxed text-muted ${
                  sys.featured ? 'md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-2 md:space-y-0' : ''
                }`}
              >
                {sys.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                {sys.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
