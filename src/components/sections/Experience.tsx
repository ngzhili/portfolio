/**
 * Experience — vertical timeline of roles. Content from content/site.ts.
 * Mobile: single column with a left rail. md+: roomier with the same rail.
 * Each role is collapsible — click the header to expand/collapse the details.
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { ChevronDownIcon } from '@/components/ui/icons';
import { experience, type Experience as Job } from '@content/site';
import { withBasePath } from '@/lib/asset';

/** Initials fallback when a job has no logo (e.g. "Procter & Gamble" → "PG"). */
function monogram(company: string): string {
  return company
    .replace(/[(].*?[)]/g, '') // drop parenthetical suffixes like "(DSTA)"
    .split(/[\s,&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function ExperienceItem({ job, defaultOpen }: { job: Job; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `exp-body-${job.company.replace(/\s+/g, '-')}`;
  const hasBody = Boolean(job.description) || (job.highlights?.length ?? 0) > 0;

  return (
    <div className="group rounded-2xl border border-border bg-surface/60 transition-colors hover:border-accent/40">
      {/* Header — clickable toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-start gap-4 rounded-2xl p-5 text-left sm:p-6"
      >
        {/* Company logo chip */}
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border transition-colors group-hover:border-accent/40 ${
            job.logo ? 'bg-white p-1.5' : 'bg-surface-2'
          }`}
        >
          {job.logo ? (
            <Image
              src={withBasePath(job.logo)}
              alt={`${job.company} logo`}
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-sm font-bold text-gradient">{monogram(job.company)}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="text-lg font-semibold text-text sm:text-xl">
              {job.role}
              <span className="text-accent-strong"> · {job.company}</span>
            </h3>
            <span className="shrink-0 text-sm font-medium text-faint">{job.period}</span>
          </div>
          {job.location && <p className="mt-1 text-sm text-faint">{job.location}</p>}
        </div>

        {hasBody && (
          <ChevronDownIcon
            className={`mt-1 shrink-0 text-faint transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Collapsible body — animated via grid-rows trick */}
      {hasBody && (
        <div
          id={bodyId}
          className={`grid transition-all duration-300 ease-out ${
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {job.description && (
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                  {job.description}
                </p>
              )}
              {job.highlights && job.highlights.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {job.highlights.map((h, hi) => (
                    <li key={hi} className="flex gap-2.5 text-sm text-muted">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Career"
      title="Work Experience"
      intro="A timeline of the roles where I've grown and shipped."
    >
      <ol className="relative space-y-10 border-l border-border pl-6 sm:pl-8">
        {experience.map((job, i) => (
          <Reveal as="li" key={`${job.company}-${i}`} delay={i * 0.05} className="relative">
            {/* Timeline node */}
            <span
              aria-hidden
              className="absolute -left-[31px] top-[37px] h-3.5 w-3.5 rounded-full border-2 border-accent bg-bg sm:-left-[39px] sm:top-[41px]"
            />
            <ExperienceItem job={job} defaultOpen={i === 0} />
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
