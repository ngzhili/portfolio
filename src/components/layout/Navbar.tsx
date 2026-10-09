'use client';

/**
 * Navbar — fixed, translucent, blurred top bar.
 *  • Desktop (≥768px): inline section links + a "Blog" link.
 *  • Mobile (<768px): accessible hamburger menu (aria-expanded, Esc to close,
 *    closes on link click, locks body scroll while open, focus moves into menu).
 *
 * Section links smooth-scroll on the home page and route to "/#id" elsewhere.
 *
 * Motion follows the active preset: presets with `navPill` slide one shared
 * highlight between links (layoutId); `calm` cross-fades per link. The mobile
 * panel and its links animate in and out.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotion } from '@/components/motion/MotionProvider';
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
  const { tokens } = useMotion();
  const pillTransition = tokens.spring
    ? { type: 'spring' as const, stiffness: 400, damping: 32 }
    : { duration: tokens.dur.base, ease: tokens.ease };

  // Add a subtle background once the user scrolls past the top. rAF-throttled
  // and change-only, so a scroll costs one boolean compare per frame rather
  // than a React state write per scroll event.
  useEffect(() => {
    let raf = 0;
    let last = window.scrollY > 8;
    setScrolled(last);
    const onScroll = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = window.scrollY > 8;
        if (next !== last) {
          last = next;
          setScrolled(next);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, []);

  // Scrollspy: highlight the nav link for the section currently in view.
  // Only runs on the home page, where the sections actually exist.
  useEffect(() => {
    if (!onHome) return;
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // Active = the section straddling the navbar line (top above it, bottom
    // below). Ratio-based scoring fails for tall sections (Experience,
    // Projects), whose visible-fraction stays low even when they fill the
    // viewport. Sections land at scroll-padding-top (5rem = 80px) after a
    // click; the extra slack makes the target count as crossed despite
    // subpixel rounding.
    //
    // Collapsing the root to a 1px band at that line expresses exactly this
    // test, so the browser does the work off the main thread — no scroll
    // listener and no getBoundingClientRect() sweep per frame.
    const navOffset = 96;
    const visible = new Set<string>();
    let current = '';

    let observer: IntersectionObserver | null = null;
    const connect = () => {
      observer?.disconnect();
      visible.clear();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          // Last section (in page order) touching the band. When nothing does —
          // a gap, or the footer filling the band at the very bottom — keep the
          // previous one, so the final section stays highlighted.
          let next = current;
          for (const s of sections) if (visible.has(s.id)) next = s.id;
          if (next && next !== current) {
            current = next;
            setActive(next);
          }
        },
        {
          rootMargin: `-${navOffset}px 0px -${Math.max(
            0,
            window.innerHeight - navOffset - 1
          )}px 0px`,
          threshold: 0,
        }
      );
      els.forEach((el) => observer!.observe(el));
    };
    connect();

    // The bottom margin is derived from the viewport height, so rebuild on resize.
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(connect, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
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
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? 'border-b border-border bg-bg/80 backdrop-blur-md'
          : 'border-b border-transparent backdrop-blur-none'
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
                  className={`relative block rounded-full px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? `text-accent-strong ${tokens.navPill ? '' : 'bg-accent/10'}`
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {isActive && tokens.navPill && (
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-full bg-accent/15"
                      transition={pillTransition}
                    />
                  )}
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'menu'}
                className="block"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: tokens.dur.fast }}
              >
                {open ? <CloseIcon /> : <MenuIcon />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panelRef}
          tabIndex={-1}
          className="overflow-hidden border-t border-border bg-bg/95 backdrop-blur-md md:hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: tokens.dur.base, ease: tokens.spring ? [0.16, 1, 0.3, 1] : tokens.ease }}
        >
          <ul className="space-y-1 px-4 py-4 sm:px-6">
            {sections.map((s, i) => {
              const isActive = onHome && active === s.id;
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    ...(tokens.spring
                      ? { type: 'spring' as const, ...tokens.spring }
                      : { duration: tokens.dur.base, ease: tokens.ease }),
                    delay: 0.04 + i * (tokens.stagger / 2),
                  }}
                >
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
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
