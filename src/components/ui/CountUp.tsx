'use client';

/**
 * CountUp — animates a numeric value from 0 to its target when scrolled into
 * view. Parses a string like "2000+" into prefix / number / suffix so any
 * surrounding characters ("+", "$", "k") are preserved. Honors
 * prefers-reduced-motion by jumping straight to the final value.
 *
 * Usage: <CountUp value="2000+" />
 */
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function CountUp({
  value,
  duration = 1.6,
  className = '',
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();

  // Split "2000+" -> { prefix: "", target: 2000, suffix: "+" }
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  const prefix = match?.[1] ?? '';
  const target = match ? Number(match[2].replace(/,/g, '')) : NaN;
  const suffix = match?.[3] ?? '';

  const hasGroup = match?.[2]?.includes(',') ?? false;
  const format = (n: number) =>
    hasGroup ? Math.round(n).toLocaleString('en-US') : String(Math.round(n));

  const [display, setDisplay] = useState(() =>
    Number.isNaN(target) ? value : `${prefix}0${suffix}`,
  );

  useEffect(() => {
    if (Number.isNaN(target)) return;
    if (!inView || reduceMotion) {
      setDisplay(`${prefix}${format(target)}${suffix}`);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (n) => setDisplay(`${prefix}${format(n)}${suffix}`),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion, target]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
