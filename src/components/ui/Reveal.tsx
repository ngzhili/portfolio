'use client';

/**
 * Reveal — fades children in once when they scroll into view. The start state
 * (offset, scale, blur), the timing and the trigger threshold all come from
 * the active motion preset (src/lib/motion.ts via useMotion).
 *
 * Under prefers-reduced-motion, MotionConfig reducedMotion="user" (set in
 * MotionProvider) drops the transform; blur isn't a transform, so it is
 * dropped here. What remains is a quick fade.
 *
 * Usage: <Reveal delay={0.1}>...</Reveal>
 */
import { motion } from 'framer-motion';
import { useStableReducedMotion } from '@/components/motion/useStableReducedMotion';
import type { ReactNode } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { enterTransition } from '@/lib/motion';

export function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'span';
}) {
  const { tokens } = useMotion();
  const reduce = useStableReducedMotion();
  const { y, scale } = tokens.enter;
  // Keep the filter key whenever the preset blurs, even at 0px under reduced
  // motion, so the animation always clears a blur the static HTML may carry.
  const hasBlur = tokens.enter.blur > 0;
  const blur = reduce ? 0 : tokens.enter.blur;
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{
        opacity: 0,
        y,
        scale,
        ...(hasBlur ? { filter: `blur(${blur}px)` } : {}),
      }}
      whileInView={{ opacity: 1, y: 0, scale: 1, ...(hasBlur ? { filter: 'blur(0px)' } : {}) }}
      viewport={{ once: true, amount: tokens.viewportAmount }}
      transition={{
        ...enterTransition(tokens, delay),
        // Fade on a tween even when the transform springs, so it never flickers.
        opacity: { duration: tokens.dur.base, ease: tokens.ease, delay },
      }}
    >
      {children}
    </MotionTag>
  );
}
