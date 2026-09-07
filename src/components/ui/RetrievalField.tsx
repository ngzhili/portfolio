'use client';

/**
 * RetrievalField — the hero background: a vector store, drawn.
 *
 * ~140 points drift in place (document chunks in embedding space) with faint
 * edges between near neighbours. Every few seconds a query point sweeps in,
 * its top-k nearest chunks light up in cyan, hold, then fade — the retrieval
 * step of a RAG pipeline, rendered literally.
 *
 * Canvas 2D on purpose. The whole frame is three batched paths (~200 line
 * segments + 140 arcs), capped at 30fps, so it costs a fraction of a
 * millisecond and never competes with the compositor during scroll. It pauses
 * offscreen and in background tabs, and renders one static frame under
 * prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';

const N = 140; // chunks in the field
const K = 5; // top-k lit by each query
const EDGE_D = 90; // px — neighbour edges drawn below this distance
const EDGE_D2 = EDGE_D * EDGE_D;
const FPS_MIN_DT = 30; // ms between draws (~30fps; 33 would drift to 20 on a 60Hz clock)
const MAX_DPR = 1.5;
const TAU = Math.PI * 2;

// Query cycle, in ms.
const T_IDLE = 1600;
const T_SWEEP = 1100;
const T_HOLD = 1400;
const T_FADE = 800;
const T_RING = 600; // expanding ring on arrival
const T_LIT_RAMP = 300; // fade-in for the lit neighbours

// Hero copy geometry: Container is max-w-6xl (1152) with px-8, the copy block
// inside it is max-w-3xl (768). Points are seeded sparsely to the left of this
// line so the field thins out behind the headline instead of fighting it.
const CONTAINER_W = 1152;
const COPY_W = 768;
const COPY_PAD = 32;
const MD = 768; // Tailwind md — below this the copy spans the full width

const DARK_ALPHA = { dot: 0.5, edge: 0.11, litDot: 0.95, litEdge: 0.55 };
const LIGHT_ALPHA = { dot: 0.38, edge: 0.09, litDot: 0.9, litEdge: 0.45 };

type RGB = [number, number, number];

/** `#rrggbb` (or `#rgb`) → [r,g,b]; falls back when the var is missing. */
function parseHex(hex: string, fallback: RGB): RGB {
  const h = hex.trim().replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length === 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  return fallback;
}

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

export function RetrievalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ── State ───────────────────────────────────────────────────────────────
    // Structure-of-arrays, allocated once. Nothing in the frame loop allocates.
    const homeX = new Float32Array(N);
    const homeY = new Float32Array(N);
    const ampX = new Float32Array(N);
    const ampY = new Float32Array(N);
    const freqX = new Float32Array(N);
    const freqY = new Float32Array(N);
    const phX = new Float32Array(N);
    const phY = new Float32Array(N);
    const rad = new Float32Array(N);
    const px = new Float32Array(N);
    const py = new Float32Array(N);

    const topK = new Int32Array(K);
    const topD2 = new Float32Array(K);

    let W = 0;
    let H = 0;
    let wide = false; // W >= MD
    let t = 0; // seconds of animated time
    let rafId = 0;
    let lastDraw = 0;
    let onScreen = true;
    let reduced = false;

    let accent: RGB = [139, 92, 246];
    let cyan: RGB = [34, 211, 238];
    let alpha = DARK_ALPHA;

    type Phase = 'idle' | 'sweep' | 'hold' | 'fade';
    const q = {
      phase: 'idle' as Phase,
      start: 0, // ms timestamp the phase began
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
      x: 0,
      y: 0,
    };

    const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    // ── Theme ───────────────────────────────────────────────────────────────
    // Tailwind v4 @theme emits these on :root and html.light overrides them, so
    // the computed value is already the themed hex.
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      accent = parseHex(cs.getPropertyValue('--color-accent'), [139, 92, 246]);
      cyan = parseHex(cs.getPropertyValue('--color-cyan'), [34, 211, 238]);
      alpha = document.documentElement.classList.contains('light')
        ? LIGHT_ALPHA
        : DARK_ALPHA;
    };

    // ── Seeding ─────────────────────────────────────────────────────────────
    /** Right edge of the headline column; 0 on mobile, where copy is full-width. */
    const copyEdge = () =>
      wide ? Math.max(0, (W - CONTAINER_W) / 2) + COPY_PAD + COPY_W + 24 : 0;

    const seed = () => {
      const edge = copyEdge();
      for (let i = 0; i < N; i++) {
        // Rejection sample: behind the copy, keep only ~1 in 4 candidates.
        let x = 0;
        let y = 0;
        for (let tries = 0; tries < 12; tries++) {
          x = -20 + Math.random() * (W + 40);
          y = -20 + Math.random() * (H + 40);
          if (x >= edge || Math.random() < 0.25) break;
        }
        homeX[i] = x;
        homeY[i] = y;
        ampX[i] = 8 + Math.random() * 12;
        ampY[i] = 8 + Math.random() * 12;
        freqX[i] = 0.15 + Math.random() * 0.25;
        freqY[i] = 0.15 + Math.random() * 0.25;
        phX[i] = Math.random() * TAU;
        phY[i] = Math.random() * TAU;
        rad[i] = 1.3 + Math.random() * 0.9;
      }
    };

    // ── Query ───────────────────────────────────────────────────────────────
    const newQuery = (now: number) => {
      const edge = copyEdge();
      const minX = wide ? edge + 40 : 0;
      q.toX = minX + Math.random() * Math.max(1, W - minX);
      q.toY = H * (0.15 + Math.random() * 0.7);
      // Enter from just outside the nearest edge, so it reads as arriving.
      if (Math.random() < 0.5) {
        q.fromX = W + 60;
        q.fromY = q.toY + (Math.random() - 0.5) * H * 0.5;
      } else {
        q.fromX = q.toX + (Math.random() - 0.5) * W * 0.3;
        q.fromY = H + 60;
      }
      q.x = q.fromX;
      q.y = q.fromY;
      q.phase = 'sweep';
      q.start = now;
    };

    /** One pass, squared distances, insertion into a K-slot sorted array. */
    const computeTopK = () => {
      for (let k = 0; k < K; k++) {
        topK[k] = -1;
        topD2[k] = Infinity;
      }
      for (let i = 0; i < N; i++) {
        const dx = px[i] - q.x;
        const dy = py[i] - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= topD2[K - 1]) continue;
        let k = K - 1;
        while (k > 0 && topD2[k - 1] > d2) {
          topD2[k] = topD2[k - 1];
          topK[k] = topK[k - 1];
          k--;
        }
        topD2[k] = d2;
        topK[k] = i;
      }
    };

    // ── Draw ────────────────────────────────────────────────────────────────
    const draw = (now: number) => {
      // Positions: bounded wander around a fixed home. No random walk, so the
      // density bias never diffuses away and there's no wrap-around to handle.
      for (let i = 0; i < N; i++) {
        px[i] = homeX[i] + ampX[i] * Math.sin(t * freqX[i] + phX[i]);
        py[i] = homeY[i] + ampY[i] * Math.sin(t * freqY[i] + phY[i]);
      }

      // Query state machine.
      let env = 0; // 0..1 envelope for the lit neighbours
      const elapsed = now - q.start;
      switch (q.phase) {
        case 'idle':
          if (elapsed > T_IDLE) newQuery(now);
          break;
        case 'sweep': {
          const p = Math.min(1, elapsed / T_SWEEP);
          const e = easeOutCubic(p);
          q.x = q.fromX + (q.toX - q.fromX) * e;
          q.y = q.fromY + (q.toY - q.fromY) * e;
          if (p >= 1) {
            computeTopK();
            q.phase = 'hold';
            q.start = now;
          }
          break;
        }
        case 'hold':
          env = Math.min(1, elapsed / T_LIT_RAMP);
          if (elapsed > T_HOLD) {
            q.phase = 'fade';
            q.start = now;
          }
          break;
        case 'fade':
          env = Math.max(0, 1 - elapsed / T_FADE);
          if (elapsed > T_FADE) {
            q.phase = 'idle';
            q.start = now;
          }
          break;
      }

      ctx.clearRect(0, 0, W, H);

      // Neighbour edges. O(n²)/2 ≈ 9.7k squared-distance checks — well under
      // 0.1ms at n=140, so a spatial hash would add code for no measurable win.
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const xi = px[i];
        const yi = py[i];
        for (let j = i + 1; j < N; j++) {
          const dx = px[j] - xi;
          const dy = py[j] - yi;
          if (dx * dx + dy * dy < EDGE_D2) {
            ctx.moveTo(xi, yi);
            ctx.lineTo(px[j], py[j]);
          }
        }
      }
      ctx.strokeStyle = rgba(accent, alpha.edge);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Chunks — one path, one fill.
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        ctx.moveTo(px[i] + rad[i], py[i]);
        ctx.arc(px[i], py[i], rad[i], 0, TAU);
      }
      ctx.fillStyle = rgba(accent, alpha.dot);
      ctx.fill();

      // Retrieved top-k.
      if (env > 0 && topK[0] >= 0) {
        ctx.beginPath();
        for (let k = 0; k < K; k++) {
          const i = topK[k];
          if (i < 0) continue;
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(px[i], py[i]);
        }
        ctx.strokeStyle = rgba(cyan, alpha.litEdge * env);
        ctx.lineWidth = 1.25;
        ctx.stroke();

        ctx.beginPath();
        for (let k = 0; k < K; k++) {
          const i = topK[k];
          if (i < 0) continue;
          ctx.moveTo(px[i] + rad[i] + 1.2, py[i]);
          ctx.arc(px[i], py[i], rad[i] + 1.2, 0, TAU);
        }
        ctx.fillStyle = rgba(cyan, alpha.litDot * env);
        ctx.fill();
      }

      // The query itself: a dot, a ring, and one expanding pulse on arrival.
      if (q.phase !== 'idle') {
        const qa = q.phase === 'fade' ? env : 1;
        ctx.beginPath();
        ctx.moveTo(q.x + 3, q.y);
        ctx.arc(q.x, q.y, 3, 0, TAU);
        ctx.fillStyle = rgba(cyan, qa);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(q.x, q.y, 7, 0, TAU);
        ctx.strokeStyle = rgba(cyan, 0.5 * qa);
        ctx.lineWidth = 1;
        ctx.stroke();

        if (q.phase === 'hold' && elapsed < T_RING) {
          const p = elapsed / T_RING;
          ctx.beginPath();
          ctx.arc(q.x, q.y, p * 70, 0, TAU);
          ctx.strokeStyle = rgba(cyan, 0.4 * (1 - p));
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    // ── Loop ────────────────────────────────────────────────────────────────
    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame); // schedule first: early return keeps the loop alive
      if (now - lastDraw < FPS_MIN_DT) return;
      const dt = Math.min(now - lastDraw, 100); // clamp across tab-hidden gaps
      lastDraw = now;
      t += dt / 1000;
      draw(now);
    };

    const shouldRun = () => !reduced && !document.hidden && onScreen;
    const start = () => {
      if (rafId !== 0 || !shouldRun()) return;
      lastDraw = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    /** One frame with the query idle — the reduced-motion resting state. */
    const drawStatic = () => {
      q.phase = 'idle';
      q.start = performance.now();
      draw(performance.now());
    };

    // ── Sizing ──────────────────────────────────────────────────────────────
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // setTransform, not scale — repeated resizes must not compound.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wasWide = wide;
      const prevW = W;
      const prevH = H;
      W = w;
      H = h;
      wide = W >= MD;

      if (prevW === 0 || wide !== wasWide) {
        // First run, or the copy column changed shape — reseed.
        seed();
      } else {
        // Scale homes in place: no pop, and it absorbs mobile URL-bar resizes.
        const sx = W / prevW;
        const sy = H / prevH;
        for (let i = 0; i < N; i++) {
          homeX[i] *= sx;
          homeY[i] *= sy;
        }
      }
      if (reduced) drawStatic();
    };

    // ── Wiring ──────────────────────────────────────────────────────────────
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = motionQuery.matches;

    readTheme();
    resize();

    const onMotionChange = () => {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        drawStatic();
      } else {
        start();
      }
    };
    motionQuery.addEventListener('change', onMotionChange);

    const themeObserver = new MutationObserver(() => {
      readTheme();
      if (reduced) drawStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Deliberately no scroll listener: this is cheap enough to keep running,
    // and freezing on scroll is what made the old shader read as stuttering.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { rootMargin: '100px' }
    );
    intersectionObserver.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) drawStatic();
    else start();

    return () => {
      stop();
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
  );
}

export default RetrievalField;
