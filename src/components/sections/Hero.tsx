'use client';

/**
 * Hero — the intro: name, role, tagline, CTAs, and social links.
 * Content from content/site.ts. The only <h1> on the page lives here.
 */
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { RetrievalField } from '@/components/ui/RetrievalField';
import { site, socials, skills } from '@content/site';
import {
  GitHubIcon,
  LinkedInIcon,
  GlobeIcon,
  MailIcon,
  ArrowRightIcon,
} from '@/components/ui/icons';

const socialLinks = [
  { href: socials.github, label: 'GitHub', Icon: GitHubIcon },
  { href: socials.linkedin, label: 'LinkedIn', Icon: LinkedInIcon },
  // { href: socials.website, label: 'Website', Icon: GlobeIcon },
  { href: `mailto:${socials.email}`, label: 'Email', Icon: MailIcon },
];

// What the chunks in the retrieval field stand for. Derived from the skills
// list rather than hardcoded, so it follows content/site.ts; filtered to
// short, parenthesis-free tokens that fit beside a 2px dot.
const chunkLabels = [
  ...new Set(
    skills
      .flatMap((group) => group.items)
      .filter((s) => s.length <= 18 && !s.includes('('))
  ),
];

// Stagger children in on load.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } },
};

export function Hero() {
  // The retrieval field listens on this section, so clicks anywhere in the
  // hero (except on the links) pin a query — see RetrievalField.
  const heroRef = useRef<HTMLElement>(null);

  // Fade the scroll cue out as the user leaves the hero.
  const { scrollY } = useScroll();
  const cueOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  // Fade the shader background out over the first chunk of scroll.
  const shaderOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      {/* Vector-store retrieval field — fades as you scroll past. */}
      <motion.div
        style={{ opacity: shaderOpacity }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <RetrievalField interactionRef={heroRef} labels={chunkLabels} />
      </motion.div>

      <Container className="relative z-10 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl"
        >
          <motion.p
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px] shadow-cyan" />
            Available for new opportunities
          </motion.p>

          <motion.h1
            variants={item}
            className="text-[clamp(2.5rem,8vw,4.75rem)] font-bold leading-[1.05]"
          >
            Hi, I&apos;m <span className="text-gradient">{site.name}</span>.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-4 text-xl font-medium text-text sm:text-2xl"
          >
            {site.role}
          </motion.p>

          <motion.p
            variants={item}
            className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
          >
            {site.intro}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <Button href="#projects" size="lg">
              View my work
              <ArrowRightIcon />
            </Button>
            <Button href="#contact" variant="secondary" size="lg">
              Get in touch
            </Button>
          </motion.div>

          {/* Social links */}
          <motion.div variants={item} className="mt-10 flex items-center gap-3">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="rounded-full border border-border bg-surface/60 p-2.5 text-muted transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:text-text"
              >
                <Icon />
              </a>
            ))}
          </motion.div>

          {/* Legend for the field behind the copy. Permanent: the invitation is
              worth keeping for anyone who arrives after the first click. */}
          <motion.div variants={item} className="mt-8 hidden md:block">
            <p className="font-mono text-xs text-muted/60">
              vector store &middot; top-5 nearest neighbours &middot; click anywhere to
              retrieve
            </p>
          </motion.div>
        </motion.div>
      </Container>

      {/* Decorative scroll cue */}
      <motion.div
        style={{ opacity: cueOpacity }}
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block"
      >
        <div className="h-10 w-6 rounded-full border border-border p-1">
          <motion.div
            className="mx-auto h-2 w-1 rounded-full bg-muted"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
}
