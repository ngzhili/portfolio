'use client';

/**
 * ThemeToggle — switches between dark (default) and light themes by toggling
 * the `light` class on <html> and persisting the choice to localStorage.
 *
 * A pre-paint inline script in layout.tsx applies the saved theme before React
 * hydrates, so there's no flash of the wrong theme. This component just syncs
 * its icon to the current state and flips it on click.
 */
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@/components/ui/icons';

type Theme = 'dark' | 'light';

export function ThemeToggle({ className = '' }: { className?: string }) {
  // `null` until mounted so we don't render a mismatched icon on the server.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    const root = document.documentElement;
    root.classList.toggle('light', next === 'light');
    root.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
    setTheme(next);
  };

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      className={`inline-flex items-center justify-center rounded-full border border-border bg-surface/60 p-2 text-muted transition-colors hover:border-accent/60 hover:text-text ${className}`}
    >
      {/* Render nothing meaningful until mounted to avoid hydration mismatch. */}
      {theme === null ? (
        <span className="block h-5 w-5" aria-hidden />
      ) : isLight ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </button>
  );
}
