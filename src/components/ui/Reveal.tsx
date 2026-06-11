'use client';

/**
 * Reveal — wraps children in a Framer Motion fade/slide-up that triggers once
 * when scrolled into view. Honors prefers-reduced-motion (Framer disables the
 * animation automatically when the user opts out).
 *
 * Usage: <Reveal delay={0.1}>...</Reveal>
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

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
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </MotionTag>
  );
}
