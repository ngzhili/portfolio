/**
 * Publications — academic / research papers as citation-style cards.
 * Content from content/site.ts (`publications`).
 */
import Image from 'next/image';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Tag } from '@/components/ui/Tag';
import { publications } from '@content/site';
import { withBasePath } from '@/lib/asset';
import { ExternalLinkIcon } from '@/components/ui/icons';

export function Publications() {
  if (publications.length === 0) return null;

  return (
    <Section
      id="publications"
      eyebrow="Research"
      title="Publications"
      intro="Peer-reviewed research I've contributed to."
    >
      <ul className="space-y-6">
        {publications.map((pub, i) => (
          <Reveal as="li" key={pub.title} delay={i * 0.06}>
            <article className="overflow-hidden rounded-2xl border border-border bg-surface/60 transition-colors hover:border-accent/40">
              {pub.image && (
                <div className="relative aspect-[1759/435] w-full overflow-hidden bg-surface-2">
                  <Image
                    src={withBasePath(pub.image)}
                    alt={`${pub.title} teaser`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-contain"
                  />
                </div>
              )}
              <div className="p-6 sm:p-7">
              <p className="text-sm font-medium text-cyan">{pub.venue}</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-text sm:text-xl">
                {pub.title}
              </h3>
              <p className="mt-2 text-sm italic text-faint">{pub.authors}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {pub.description}
              </p>

              {pub.tags && pub.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pub.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              )}

              {pub.links && pub.links.some((l) => l.href) && (
                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                  {pub.links
                    .filter((l) => l.href)
                    .map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-text transition-colors hover:text-cyan"
                      >
                        <ExternalLinkIcon /> {l.label}
                      </a>
                    ))}
                </div>
              )}
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
