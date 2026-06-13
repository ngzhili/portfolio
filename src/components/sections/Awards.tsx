/**
 * Awards — an auto-scrolling marquee of award / honour cards.
 * Content from content/site.ts.
 *
 * The track holds two copies of the cards and scrolls continuously (CSS
 * keyframes). It pauses while the user hovers / focuses / touches a card — or
 * while a detail panel is open — and resumes when interaction ends. Clicking a
 * card expands a detail panel below the strip with the full blurb. Under
 * prefers-reduced-motion the strip becomes a manual scroll-snap row (see
 * globals.css). Mirrors the Certifications section.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { awards, type Award } from '@content/site';
import { withBasePath } from '@/lib/asset';

/** Map any translateX into (-half, 0] so the loop stays seamless in both
 *  directions (auto-scroll decreases x; dragging right increases it). */
function wrapTranslate(v: number, half: number): number {
  if (half <= 0) return v;
  let r = v % half;
  if (r > 0) r -= half;
  return r;
}

/** Initials fallback when an award has no issuer logo (e.g. "IMDA" → "IM"). */
function monogram(issuer: string): string {
  return issuer
    .replace(/[(].*?[)]/g, '') // drop parenthetical suffixes like "(USP)"
    .split(/[\s,&–-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function AwardCard({
  award,
  active,
  onToggle,
}: {
  award: Award;
  active: boolean;
  onToggle: () => void;
}) {
  // Fall back to a monogram if the issuer logo is missing or fails to load
  // (most awards have no logo PNG).
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(award.logo) && !logoFailed;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={active}
      className={`group flex w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl border bg-surface/60 p-5 text-left transition-colors ${
        active ? 'border-accent/60' : 'border-border hover:border-accent/40'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Issuer logo chip — white bg so dark logos read on the dark theme. */}
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border transition-colors group-hover:border-accent/40 ${
            showLogo ? 'bg-white p-1.5' : 'bg-surface-2'
          }`}
        >
          {showLogo ? (
            <Image
              src={withBasePath(award.logo!)}
              alt={`${award.issuer} logo`}
              width={44}
              height={44}
              onError={() => setLogoFailed(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs font-bold text-gradient">{monogram(award.issuer)}</span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-accent-strong">
            {award.issuer}
          </span>
          <span className="block text-xs text-faint">{award.date}</span>
        </span>
      </div>
      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-text">
        {award.title}
      </h3>
      <span className="mt-auto text-xs font-medium text-cyan opacity-0 transition-opacity group-hover:opacity-100">
        {active ? 'Hide details' : 'View details'}
      </span>
    </button>
  );
}

export function Awards() {
  // The selected award (by title — stable & unique) whose detail panel is open.
  const [selected, setSelected] = useState<string | null>(null);
  // True while the pointer/touch is over the strip; pauses the marquee.
  const [hovering, setHovering] = useState(false);

  const active = awards.find((a) => a.title === selected) ?? null;
  const paused = hovering || selected !== null;

  // Drive the marquee with rAF (not a CSS keyframe) so it scrolls even when the
  // OS reports prefers-reduced-motion — which the global stylesheet otherwise
  // uses to freeze all CSS animations. The track position lives in `xRef` so the
  // loop and the drag handlers can both mutate it.
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0); // current translateX in px
  const pointerActiveRef = useRef(false); // pointer pressed, may become a drag
  const draggingRef = useRef(false); // pointer moved past threshold → dragging
  const movedRef = useRef(false); // pointer moved far enough to count as a drag
  const dragStartXRef = useRef(0); // xRef when the press began
  const dragStartPointerRef = useRef(0); // pointer clientX when the press began
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    let last = 0;
    const speed = 40; // px per second
    const step = (now: number) => {
      if (last === 0) last = now;
      const dt = (now - last) / 1000;
      last = now;
      const half = track.scrollWidth / 2; // width of one copy of the cards
      // Auto-advance only when not paused (hover/detail) and not being dragged.
      if (!pausedRef.current && !draggingRef.current) {
        xRef.current = wrapTranslate(xRef.current - speed * dt, half);
      }
      track.style.transform = `translateX(${xRef.current}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Drag-to-scroll (mouse / touch / pen via Pointer Events) ────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    // Record the press but DON'T capture yet — capturing here would suppress the
    // card's native click. We only start dragging once the pointer moves enough.
    pointerActiveRef.current = true;
    movedRef.current = false;
    dragStartXRef.current = xRef.current;
    dragStartPointerRef.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerActiveRef.current) return;
    const dx = e.clientX - dragStartPointerRef.current;
    if (!draggingRef.current) {
      if (Math.abs(dx) <= 4) return; // still a potential click, not a drag yet
      draggingRef.current = true; // crossed the threshold → it's a drag
      movedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const half = (trackRef.current?.scrollWidth ?? 0) / 2;
    xRef.current = wrapTranslate(dragStartXRef.current + dx, half);
  };
  const endDrag = (e: React.PointerEvent) => {
    pointerActiveRef.current = false;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Swallow the card click that follows a drag so dragging doesn't open details.
  const handleCardClick = (title: string) => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    toggle(title);
  };

  // Esc closes the detail panel.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  const toggle = (title: string) =>
    setSelected((cur) => (cur === title ? null : title));

  return (
    <Section
      id="awards"
      eyebrow="Recognition"
      title="Awards"
      intro="Competitions, scholarships, and honours I’ve received."
    >
      <Reveal>
        <div
          className="cert-marquee-viewport relative cursor-grab select-none overflow-hidden active:cursor-grabbing"
          style={{
            // Let vertical page scroll through; we handle horizontal drag.
            touchAction: 'pan-y',
            // Fade the cards into the section edges.
            maskImage:
              'linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)',
          }}
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
        >
          <div ref={trackRef} className="flex w-max gap-5 py-2 will-change-transform">
            {/* Two copies → seamless -50% loop. Second copy is decorative. */}
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
                className="flex gap-5"
              >
                {awards.map((award) => (
                  <AwardCard
                    key={`${copy}-${award.title}`}
                    award={award}
                    active={active?.title === award.title}
                    onToggle={() => handleCardClick(award.title)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Detail panel — animated open/close via the grid-rows trick. */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          active ? 'mt-6 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {active && (
            <div className="rounded-2xl border border-accent/30 bg-surface/60 p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-lg font-semibold text-text">{active.title}</h3>
                <span className="shrink-0 text-sm font-medium text-faint">
                  {active.issuer} · {active.date}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {active.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
