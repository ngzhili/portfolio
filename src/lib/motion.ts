/**
 * Motion system — one set of tokens per preset. Every animated component reads
 * its timing from here (via useMotion() in MotionProvider), and the CSS-side
 * tokens (--m-dur, --m-lift, --m-press in globals.css) follow the same preset
 * through `html[data-motion]`.
 *
 *   calm       quiet, short, no overshoot — the site's original feel, tidied
 *   kinetic    springy and tactile: per-word headline, sliding nav pill, press
 *   cinematic  long expo-out eases, blur-in reveals, scroll-linked depth
 *
 * The default lives in content/site.ts (`motionPreset`); `?motion=<preset>`
 * overrides it per visit so the three can be compared without a rebuild.
 */
export type MotionPreset = 'calm' | 'kinetic' | 'cinematic';

export const MOTION_PRESETS: MotionPreset[] = ['calm', 'kinetic', 'cinematic'];

export type Ease = [number, number, number, number];

export type MotionTokens = {
  ease: Ease;
  /** When set, entrances use a spring instead of `ease` + `dur.base`. */
  spring?: { stiffness: number; damping: number; mass?: number };
  /** Seconds. */
  dur: { fast: number; base: number; slow: number };
  /** Where a Reveal starts from: px offset, blur in px, scale. */
  enter: { y: number; blur: number; scale: number };
  stagger: number;
  /** Fraction of an element that must be visible before it reveals. */
  viewportAmount: number;
  /** Hero h1 treatment. */
  headline: 'mask' | 'words' | 'rise';
  /** One shared sliding pill behind the active nav link. */
  navPill: boolean;
  /** Scroll-linked depth: hero parallax, section-header drift, progress bar. */
  scrollLinked: boolean;
  /** Pressed scale for buttons (1 = no press). */
  press: number;
};

export const presets: Record<MotionPreset, MotionTokens> = {
  calm: {
    ease: [0.21, 0.47, 0.32, 0.98],
    dur: { fast: 0.18, base: 0.4, slow: 0.6 },
    enter: { y: 16, blur: 0, scale: 1 },
    stagger: 0.06,
    viewportAmount: 0.2,
    headline: 'mask',
    navPill: false,
    scrollLinked: false,
    press: 1,
  },
  kinetic: {
    ease: [0.34, 1.3, 0.64, 1], // slight overshoot, for the non-spring tweens
    spring: { stiffness: 260, damping: 24 },
    dur: { fast: 0.15, base: 0.35, slow: 0.5 },
    enter: { y: 28, blur: 0, scale: 0.98 },
    stagger: 0.07,
    viewportAmount: 0.2,
    headline: 'words',
    navPill: true,
    scrollLinked: false,
    press: 0.97,
  },
  cinematic: {
    ease: [0.16, 1, 0.3, 1], // expo-out
    dur: { fast: 0.25, base: 0.7, slow: 1 },
    enter: { y: 40, blur: 8, scale: 0.985 },
    stagger: 0.1,
    viewportAmount: 0.35,
    headline: 'rise',
    navPill: true,
    scrollLinked: true,
    press: 1,
  },
};

export const isPreset = (s: string | null | undefined): s is MotionPreset =>
  !!s && (MOTION_PRESETS as string[]).includes(s);

/** Entrance transition for the preset: a spring if it has one, else a tween. */
export const enterTransition = (t: MotionTokens, delay = 0) =>
  t.spring
    ? { type: 'spring' as const, ...t.spring, delay }
    : { duration: t.dur.base, ease: t.ease, delay };
