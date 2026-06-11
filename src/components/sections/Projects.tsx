/**
 * Projects — responsive card grid. Content from content/site.ts.
 * Grid: 1 col (mobile) → 2 (sm) → 3 (lg). Cards lazy-load their thumbnails.
 */
import Image from 'next/image';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Tag } from '@/components/ui/Tag';
import { projects } from '@content/site';
import { withBasePath } from '@/lib/asset';
import { getStarsForRepos } from '@/lib/github';
import { GitHubIcon, ExternalLinkIcon, StarIcon, MediumIcon } from '@/components/ui/icons';

export async function Projects() {
  // Fetched at build time (static export) — see src/lib/github.ts.
  const stars = await getStarsForRepos(projects.map((p) => p.repo));

  return (
    <Section
      id="projects"
      eyebrow="Work"
      title="Featured Projects"
      intro="A selection of things I've designed and built."
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <Reveal key={project.title} delay={(i % 3) * 0.08} className="h-full">
            <article
              className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-surface/60 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 ${
                project.featured ? 'border-accent/30' : 'border-border'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                <Image
                  // unoptimized export doesn't auto-prefix basePath onto the
                  // src, so do it ourselves (works in dev where basePath is '').
                  src={withBasePath(project.image)}
                  alt={`${project.title} preview`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-text">{project.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {project.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>

                {/* Links */}
                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-text transition-colors hover:text-cyan"
                    >
                      <ExternalLinkIcon /> Live demo
                    </a>
                  )}
                  {project.repo && (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
                    >
                      <GitHubIcon width={16} height={16} /> Code
                      {stars[i] != null && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                          <StarIcon className="text-yellow-500" /> {stars[i]}
                        </span>
                      )}
                    </a>
                  )}
                  {project.medium && (
                    <a
                      href={project.medium}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
                    >
                      <MediumIcon /> Article
                    </a>
                  )}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
