/**
 * Section — a full-width page section with an anchor id (for smooth-scroll nav),
 * vertical rhythm, and an optional eyebrow + heading. The top padding already
 * clears the fixed navbar on scroll, so no extra `scroll-mt-*` offset is needed.
 */
import type { ReactNode } from 'react';
import { Container } from './Container';
import { Reveal } from '@/components/ui/Reveal';

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = '',
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-heading` : undefined}
      className={`pt-10 pb-20 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28 ${className}`}
    >
      <Container>
        {(eyebrow || title) && (
          <Reveal>
            <div className="mb-12 max-w-2xl sm:mb-14">
              {eyebrow && (
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2
                  id={`${id}-heading`}
                  className="text-3xl font-bold sm:text-4xl lg:text-[2.75rem]"
                >
                  {title}
                </h2>
              )}
              {intro && <p className="mt-4 text-base text-muted sm:text-lg">{intro}</p>}
            </div>
          </Reveal>
        )}
        {children}
      </Container>
    </section>
  );
}
