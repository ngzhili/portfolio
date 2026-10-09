'use client';

/**
 * useReducedMotion, but `false` until after hydration.
 *
 * Framer's hook reads the media query synchronously on the client, while the
 * static HTML was rendered with no preference. Any component whose *markup*
 * depends on the answer (the hero headline, Drift, ScrollProgress) would then
 * hydrate against different HTML and React would throw the whole tree away.
 * Reporting `false` for the hydration render and the real value right after
 * keeps the first client render identical to the HTML.
 */
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useStableReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated ? !!reduce : false;
}
