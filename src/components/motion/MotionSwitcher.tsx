'use client';

/**
 * MotionSwitcher — a small fixed pill for comparing motion presets.
 * Shown in `npm run dev`, or on any build when the URL carries ?motion=, so
 * the deployed site stays clean unless someone opts in.
 */
import { useEffect, useState } from 'react';
import { MOTION_PRESETS } from '@/lib/motion';
import { useMotion } from './MotionProvider';

export function MotionSwitcher() {
  const { preset, setPreset } = useMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(
      process.env.NODE_ENV !== 'production' ||
        new URLSearchParams(window.location.search).has('motion')
    );
  }, []);

  if (!show) return null;

  return (
    <div
      role="group"
      aria-label="Motion preset"
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-1 rounded-full border border-border bg-surface/90 p-1 font-mono text-xs shadow-lg backdrop-blur"
    >
      <span className="px-2 text-faint">motion</span>
      {MOTION_PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={p === preset}
          onClick={() => setPreset(p)}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            p === preset ? 'bg-accent text-white' : 'text-muted hover:text-text'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
