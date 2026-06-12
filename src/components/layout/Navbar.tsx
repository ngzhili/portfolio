'use client';

/**
 * Navbar — fixed, translucent, blurred top bar.
 *  • Desktop (≥768px): inline section links + a "Blog" link.
 *  • Mobile (<768px): accessible hamburger menu (aria-expanded, Esc to close,
 *    closes on link click, locks body scroll while open, focus moves into menu).
 *
 * Section links smooth-scroll on the home page and route to "/#id" elsewhere.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sections, sectionHref } from '@/lib/nav';
import { site } from '@content/site';
import { MenuIcon, CloseIcon } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const onHome = pathname === '/' || pathname === '';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');
  const panelRef = useRef<HTMLDivElement>(null);

  // Add a subtle background once the user scrolls past the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scrollspy: highlight the nav link for the section currently in view.
  // Only runs on the home page, where the sections actually exist.
  useEffect(() => {
    if (!onHome) return;
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // Active = the last section whose top has scrolled past the navbar line.
    // Ratio-based scoring fails for tall sections (Experience, Projects),
    // whose visible-fraction stays low even when they fill the viewport.
    // Sections land at scroll-padding-top (5rem = 80px) after a click; add
    // slack so the target counts as crossed despite subpixel rounding.
    const navOffset = 96;
    const pickActive = () => {
      // Active = the section straddling the navOffset line (top above it,
      // bottom below). Fall back to the last section whose top has crossed,
      // so the final section still highlights at the very bottom of the page.
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= navOffset && bottom > navOffset) {
          current = s.id;
          break;
        }
        if (top <= navOffset) current = s.id;
      }
      setActive(current);
    };
    const observer = new IntersectionObserver(pickActive, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    els.forEach((el) => observer.observe(el));
    window.addEventListener('scroll', pickActive, { passive: true });
    pickActive();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', pickActive);
    };
  }, [onHome]);

  // While the mobile menu is open: lock scroll, close on Esc, focus the panel.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? 'border-b border-border bg-bg/80 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        {/* Brand / home link */}
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-text"
          onClick={() => setOpen(false)}
        >
          {site.name.split(' ')[1]}
          <span className="text-accent-strong">.</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {sections.map((s) => {
            const isActive = onHome && active === s.id;
            return (
              <li key={s.id}>
                <a
                  href={sectionHref(s.id, onHome)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`rounded-full px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent-strong'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            );
          })}
          <li className="ml-1">
            <ThemeToggle />
          </li>
        </ul>

        {/* Mobile: theme toggle + hamburger (both always visible) */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-text"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          tabIndex={-1}
          className="border-t border-border bg-bg/95 backdrop-blur-md md:hidden"
        >
          <ul className="space-y-1 px-4 py-4 sm:px-6">
            {sections.map((s) => {
              const isActive = onHome && active === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={sectionHref(s.id, onHome)}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`block rounded-lg px-3 py-3 text-base transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent-strong'
                        : 'text-muted hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
