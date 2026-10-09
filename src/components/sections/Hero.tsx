'use client';

/**
 * Hero — the intro: positioning headline, name and role, tagline, CTAs, and
 * social links over an animated background. Content from content/site.ts.
 * The only <h1> on the page lives here.
 *
 * The background is chosen by `heroVariant` in content/site.ts:
 *   'agent'     → AgentTraceField (an agent run: plan → tools → reflect → answer)
 *   'retrieval' → RetrievalField  (the original vector-store top-k field)
 */
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useMotion } from '@/components/motion/MotionProvider';
import { enterTransition, type MotionTokens } from '@/lib/motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { RetrievalField } from '@/components/ui/RetrievalField';
import { AgentTraceField } from '@/components/ui/AgentTraceField';
import { site, socials, skills, heroVariant, heroAgent } from '@content/site';
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

// What the chunks in the retrieval field stand for (retrieval variant only).
// Derived from the skills list rather than hardcoded, so it follows
// content/site.ts; filtered to short, parenthesis-free tokens that fit beside
// a 2px dot.
const chunkLabels = [
  ...new Set(
    skills
      .flatMap((group) => group.items)
      .filter((s) => s.length <= 18 && !s.includes('('))
  ),
];

// Stagger children in on load, timed by the motion preset. Under reduced
// motion they appear at once.
const makeContainer = (t: MotionTokens) => ({
  hidden: {},
  show: { transition: { staggerChildren: t.stagger, delayChildren: 0.05 } },
});
const makeItem = (t: MotionTokens) => ({
  hidden: { opacity: 0, y: Math.round(t.enter.y * 0.75) },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...enterTransition(t), opacity: { duration: t.dur.base, ease: t.ease } },
  },
});
const containerStill = { hidden: {}, show: {} };
// `y` is reset explicitly: the server renders the animated variant's offset,
// and leaving it out here would strand the copy 20px low.
const itemStill = {
  hidden: { opacity: 0, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const H1_CLASS = 'text-[clamp(2.25rem,6.5vw,4rem)] font-bold leading-[1.05]';

/**
 * The headline, animated per the preset's `headline` treatment:
 *   mask   words rise out of their own clipping masks, near-together
 *   words  each word springs up with a little rotation, one after another
 *   rise   the whole line rises out of a blur while its tracking tightens
 * The lead is split into words; the gradient accent stays one unit (one
 * inline-block) so its gradient runs across the whole phrase.
 */
function Headline({ tokens, still }: { tokens: MotionTokens; still: boolean }) {
  const lead = site.headline.lead.trim().split(/\s+/);
  const units = [
    ...lead.map((text) => ({ text, accent: false })),
    { text: site.headline.accent, accent: true },
  ];
  const cls = (accent: boolean) => `inline-block ${accent ? 'text-gradient' : ''}`;

  if (still) {
    return (
      <h1 className={H1_CLASS}>
        {site.headline.lead}
        <span className={cls(true)}>{site.headline.accent}</span>
      </h1>
    );
  }

  if (tokens.headline === 'rise') {
    return (
      <motion.h1
        className={H1_CLASS}
        initial={{ opacity: 0, y: 40, filter: 'blur(12px)', letterSpacing: '0.02em' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', letterSpacing: '-0.02em' }}
        transition={{ duration: tokens.dur.slow * 1.2, ease: tokens.ease, delay: 0.15 }}
      >
        {site.headline.lead}
        <span className={cls(true)}>{site.headline.accent}</span>
      </motion.h1>
    );
  }

  return (
    <h1 className={H1_CLASS}>
      {units.map((u, i) => {
        const sep = u.accent ? '' : ' ';
        if (tokens.headline === 'mask') {
          return (
            <span key={i}>
              {/* Padding + matching negative margin so descenders aren't clipped. */}
              <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
                <motion.span
                  className={cls(u.accent)}
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: tokens.dur.slow * 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.12 + i * 0.03 }}
                >
                  {u.text}
                </motion.span>
              </span>
              {sep}
            </span>
          );
        }
        // words
        return (
          <span key={i}>
            <motion.span
              className={cls(u.accent)}
              initial={{ opacity: 0, y: '0.45em', rotate: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: '0em', rotate: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 18,
                delay: 0.1 + i * 0.07,
                opacity: { duration: tokens.dur.fast, delay: 0.1 + i * 0.07 },
              }}
            >
              {u.text}
            </motion.span>
            {sep}
          </span>
        );
      })}
    </h1>
  );
}

export function Hero() {
  // The background listens on this section, so clicks anywhere in the hero
  // (except on the links) interact with it — see the field components.
  const heroRef = useRef<HTMLElement>(null);
  const reduce = !!useReducedMotion();
  const { tokens } = useMotion();
  const c = reduce ? containerStill : makeContainer(tokens);
  const it = reduce ? itemStill : makeItem(tokens);

  // Fade the scroll cue out as the user leaves the hero.
  const { scrollY } = useScroll();
  const cueOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  // Fade the background out over the first chunk of scroll.
  const shaderOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  // Scroll-linked presets: the copy drifts up and dims a little as you leave.
  const copyY = useTransform(scrollY, [0, 500], [0, -60]);
  const copyOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);
  const parallax = tokens.scrollLinked && !reduce;

  const isAgent = heroVariant !== 'retrieval';

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      {/* Animated background — fades as you scroll past. */}
      <motion.div
        style={{ opacity: shaderOpacity }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        {isAgent ? (
          <AgentTraceField
            interactionRef={heroRef}
            tools={heroAgent.tools}
            queries={heroAgent.queries}
          />
        ) : (
          <RetrievalField interactionRef={heroRef} labels={chunkLabels} />
        )}
      </motion.div>

      <Container className="relative z-10 py-20">
        <motion.div
          variants={c}
          initial="hidden"
          animate="show"
          style={parallax ? { y: copyY, opacity: copyOpacity } : undefined}
          className="max-w-3xl"
        >
          <motion.p
            variants={it}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px] shadow-cyan" />
            Open to new opportunities &middot; {site.location}
          </motion.p>

          <Headline tokens={tokens} still={reduce} />

          <motion.p
            variants={it}
            className="mt-5 text-lg font-medium text-text sm:text-xl"
          >
            {site.name} <span className="text-faint">&middot;</span>{' '}
            <span className="text-muted">{site.role}</span>
          </motion.p>

          <motion.p
            variants={it}
            className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
          >
            {site.tagline}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={it} className="mt-9 flex flex-wrap items-center gap-3">
            <Button href="#agent-systems" size="lg">
              See agent systems
              <ArrowRightIcon />
            </Button>
            <Button href="#contact" variant="secondary" size="lg">
              Get in touch
            </Button>
          </motion.div>

          {/* Social links */}
          <motion.div variants={it} className="mt-10 flex items-center gap-3">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="rounded-full border border-border bg-surface/60 p-2.5 text-muted transition-all duration-[var(--m-dur)] ease-[var(--m-ease)] hover:translate-y-[var(--m-lift)] hover:border-accent/60 hover:text-text"
              >
                <Icon />
              </a>
            ))}
          </motion.div>

          {/* Legend for the field behind the copy. Permanent: the invitation is
              worth keeping for anyone who arrives after the first click. */}
          <motion.div variants={it} className="mt-8 hidden md:block">
            <p className="font-mono text-xs text-muted/60">
              {isAgent ? (
                <>
                  agent loop &middot; plan &rarr; tools &rarr; reflect &rarr; answer &middot;
                  click anywhere to run
                </>
              ) : (
                <>
                  vector store &middot; top-5 nearest neighbours &middot; click anywhere to
                  retrieve
                </>
              )}
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
            animate={reduce ? undefined : { y: [0, 12, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
}
