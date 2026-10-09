'use client';

/**
 * ScrollProgress — a 2px reading-progress bar under the navbar. Only in
 * presets with `scrollLinked`, and not under reduced motion.
 */
import { motion, useScroll, useSpring } from 'framer-motion';
import { useStableReducedMotion } from './useStableReducedMotion';
import { useMotion } from './MotionProvider';

export function ScrollProgress() {
  const { tokens } = useMotion();
  const reduce = useStableReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

  if (!tokens.scrollLinked || reduce) return null;
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-accent-strong to-cyan"
    />
  );
}
