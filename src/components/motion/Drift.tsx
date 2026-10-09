'use client';

/**
 * Drift — a gentle scroll-linked vertical drift (±24px as the element crosses
 * the viewport). Only active in presets with `scrollLinked`; otherwise it
 * renders a plain div so layout is identical and no scroll listener exists.
 */
import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useStableReducedMotion } from './useStableReducedMotion';
import { useMotion } from './MotionProvider';

type Props = { children: ReactNode; className?: string };

function DriftActive({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [24, -24]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function Drift({ children, className = '' }: Props) {
  const { tokens } = useMotion();
  const reduce = useStableReducedMotion();
  if (!tokens.scrollLinked || reduce) return <div className={className}>{children}</div>;
  return <DriftActive className={className}>{children}</DriftActive>;
}
