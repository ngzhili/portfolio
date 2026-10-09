'use client';

/**
 * MotionProvider — makes the active motion preset available to every
 * component (useMotion) and to CSS (html[data-motion]).
 *
 * The first render always uses the default preset from content/site.ts, so it
 * matches the static HTML and hydration stays clean. If the URL asks for a
 * different preset (?motion=kinetic), a layout effect switches to it before
 * the first paint and remounts the page under a new key: Framer only reads
 * `initial` on mount, so a remount is what makes the new entrances take.
 * Switching presets later (MotionSwitcher) remounts the same way, which also
 * replays the hero intro — handy when comparing.
 *
 * MotionConfig reducedMotion="user" makes every Framer animation honour
 * prefers-reduced-motion (Framer's own default is to ignore it).
 */
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MotionConfig } from 'framer-motion';
import { isPreset, presets, type MotionPreset, type MotionTokens } from '@/lib/motion';
import { motionPreset as defaultPreset } from '@content/site';

type MotionContextValue = {
  preset: MotionPreset;
  tokens: MotionTokens;
  setPreset: (p: MotionPreset) => void;
};

const MotionContext = createContext<MotionContextValue>({
  preset: defaultPreset,
  tokens: presets[defaultPreset],
  setPreset: () => {},
});

export const useMotion = () => useContext(MotionContext);

export function MotionProvider({
  children,
  chrome,
}: {
  children: ReactNode;
  /** Rendered outside the remount key (e.g. the preset switcher). */
  chrome?: ReactNode;
}) {
  const [preset, setPresetState] = useState<MotionPreset>(defaultPreset);

  useLayoutEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('motion');
    if (isPreset(fromUrl) && fromUrl !== defaultPreset) setPresetState(fromUrl);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.motion = preset;
  }, [preset]);

  const setPreset = useCallback((p: MotionPreset) => {
    setPresetState(p);
    const url = new URL(window.location.href);
    if (p === defaultPreset) url.searchParams.delete('motion');
    else url.searchParams.set('motion', p);
    window.history.replaceState(null, '', url);
  }, []);

  const value = useMemo(
    () => ({ preset, tokens: presets[preset], setPreset }),
    [preset, setPreset]
  );

  return (
    <MotionContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        <Fragment key={preset}>{children}</Fragment>
        {chrome}
      </MotionConfig>
    </MotionContext.Provider>
  );
}
