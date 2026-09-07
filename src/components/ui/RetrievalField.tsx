'use client';

/**
 * RetrievalField — the hero background: a vector store, drawn.
 *
 * ~140 points drift in place (document chunks in embedding space) with faint
 * edges between near neighbours. Every few seconds a query point sweeps in,
 * its top-k nearest chunks light up in cyan, hold, then fade — the retrieval
 * step of a RAG pipeline, rendered literally.
 *
 * It's also interactive: clicking anywhere in the hero drops your own query at
 * that spot and retrieves its top-k, with a dashed ring at its live retrieval
 * radius. Pins stack up to MAX_PINS and fade out on their own after a few
 * seconds, so the field always settles back to rest.
 *
 * Each query names its single nearest chunk, so the picture reads as retrieval
 * rather than as decoration. Exactly one label is on screen at any moment —
 * the newest live pin owns it, or the ambient query when no pin does.
 *
 * Canvas 2D on purpose. The whole frame is three batched paths (~200 line
 * segments + 140 arcs) plus a handful of small per-pin paths, capped at 30fps,
 * so it costs a fraction of a millisecond and never competes with the
 * compositor during scroll. It pauses offscreen and in background tabs, and
 * renders one static frame under prefers-reduced-motion.
 */
import { useEffect, useRef, type RefObject } from 'react';

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

// Click-pinned queries.
const MAX_PINS = 5; // live pins; a further click retires the oldest
const T_PIN_IN = 300; // ramp-in
const T_PIN_LIFE = 5500; // how long a pin holds before fading on its own
const T_PIN_OUT = 600; // retirement fade
const T_PIN_RING = 700; // arrival pulse out to the retrieval radius
const CLICK_SLOP = 6; // px of movement still counted as a click, not a drag
const CLICK_MS = 600; // ms held still counted as a click
const HIDDEN_OPACITY = 0.15; // below this the field is scrolled away — ignore clicks
const LABEL_FONT = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
const LABEL_GAP = 7; // px between the chunk dot and its label
const LABEL_FLIP = 140; // px from the right edge — hang the label left instead
const RING_DASH = [2, 4];
const NO_DASH: number[] = [];

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

export type RetrievalFieldProps = {
  /**
   * Element to listen on for clicks. The canvas itself sits under a
   * `pointer-events-none` wrapper and the hero copy, so the hero <section> is
   * the right target: clicks bubble to it from everywhere except the links,
   * and text selection on the headline keeps working. Defaults to the canvas.
   */
  interactionRef?: RefObject<HTMLElement | null>;
  /**
   * Short strings the chunks stand for; each query names its nearest one.
   * Omit (or pass an empty array) to draw no labels at all.
   */
  labels?: string[];
};

export function RetrievalField({ interactionRef, labels }: RetrievalFieldProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The effect runs once; read the latest value through a ref.
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

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
    const label = new Int16Array(N); // index into labelsRef; fixed per chunk
    const px = new Float32Array(N);
    const py = new Float32Array(N);

    const topK = new Int32Array(K);
    const topD2 = new Float32Array(K);
    const pinD2 = new Float32Array(K); // scratch for a pin's retrieval

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

    /** A query the visitor pinned by clicking. */
    type Pin = {
      x: number;
      y: number;
      born: number; // ms timestamp; 0 = appear fully formed (reduced motion)
      retiring: number; // 0 = live, else the ms timestamp the fade began
      k: Int32Array; // neighbour indices, frozen at click time
    };
    const pins: Pin[] = [];

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

      // Fixed for the chunk's lifetime: probing the same spot twice has to
      // surface the same word, or the labels read as noise rather than as an
      // identity the chunk has. Round-robin then shuffle, so every word gets
      // used a similar number of times — picking at random piles six chunks
      // onto one word and leaves others never seen.
      const pool = labelsRef.current;
      if (pool && pool.length > 0) {
        for (let i = 0; i < N; i++) label[i] = i % pool.length;
        for (let i = N - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = label[i];
          label[i] = label[j];
          label[j] = tmp;
        }
      } else {
        label.fill(-1);
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
    const computeTopK = (
      qx: number,
      qy: number,
      outK: Int32Array,
      outD2: Float32Array
    ) => {
      for (let k = 0; k < K; k++) {
        outK[k] = -1;
        outD2[k] = Infinity;
      }
      for (let i = 0; i < N; i++) {
        const dx = px[i] - qx;
        const dy = py[i] - qy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= outD2[K - 1]) continue;
        let k = K - 1;
        while (k > 0 && outD2[k - 1] > d2) {
          outD2[k] = outD2[k - 1];
          outK[k] = outK[k - 1];
          k--;
        }
        outD2[k] = d2;
        outK[k] = i;
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
            computeTopK(q.x, q.y, topK, topD2);
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

      // Pinned queries, under the ambient one. Each pin's neighbour *set* was
      // frozen at click time — drawing it at live positions lets the spokes
      // follow the drifting chunks without ever reordering (which would
      // flicker on near-ties). A handful of small paths per pin; at ≤ ~10 pins
      // that's cheaper than the edge pass above.
      for (let i = pins.length - 1; i >= 0; i--) {
        const p = pins[i];
        if (!p.retiring && !reduced && now - p.born > T_PIN_LIFE) p.retiring = now;
        if (p.retiring && now - p.retiring > T_PIN_OUT) pins.splice(i, 1);
      }
      // Exactly one label on screen at a time: the newest live pin owns it,
      // and the ambient query only gets it when no pin does.
      let labelChunk = -1;
      let labelAlpha = 0;
      let owner = -1;
      for (let i = pins.length - 1; i >= 0; i--) {
        if (!pins[i].retiring) {
          owner = i;
          break;
        }
      }

      if (pins.length > 0) {
        for (let pi = 0; pi < pins.length; pi++) {
          const p = pins[pi];
          const pe = p.retiring
            ? Math.max(0, 1 - (now - p.retiring) / T_PIN_OUT)
            : Math.min(1, (now - p.born) / T_PIN_IN);
          if (pe <= 0) continue;
          if (pi === owner) {
            labelChunk = p.k[0];
            labelAlpha = pe;
          }

          // Spokes, and the retrieval radius they imply.
          let rK = 0;
          ctx.beginPath();
          for (let k = 0; k < K; k++) {
            const i = p.k[k];
            if (i < 0) continue;
            const dx = px[i] - p.x;
            const dy = py[i] - p.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > rK) rK = d;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(px[i], py[i]);
          }
          ctx.strokeStyle = rgba(cyan, alpha.litEdge * pe);
          ctx.lineWidth = 1.25;
          ctx.stroke();

          ctx.beginPath();
          for (let k = 0; k < K; k++) {
            const i = p.k[k];
            if (i < 0) continue;
            ctx.moveTo(px[i] + rad[i] + 1.2, py[i]);
            ctx.arc(px[i], py[i], rad[i] + 1.2, 0, TAU);
          }
          ctx.fillStyle = rgba(cyan, alpha.litDot * pe);
          ctx.fill();

          // Search radius: pulses out to the k-th neighbour on arrival, then
          // settles into a faint dashed circle that breathes as chunks drift.
          const age = now - p.born;
          if (!p.retiring && age < T_PIN_RING) {
            const pr = age / T_PIN_RING;
            ctx.beginPath();
            ctx.arc(p.x, p.y, easeOutCubic(pr) * rK, 0, TAU);
            ctx.strokeStyle = rgba(cyan, 0.4 * (1 - pr));
            ctx.lineWidth = 1;
            ctx.stroke();
          } else if (rK > 0) {
            ctx.setLineDash(RING_DASH);
            ctx.beginPath();
            ctx.arc(p.x, p.y, rK, 0, TAU);
            ctx.strokeStyle = rgba(cyan, 0.16 * pe);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash(NO_DASH);
          }

          // Query marker.
          ctx.beginPath();
          ctx.moveTo(p.x + 3, p.y);
          ctx.arc(p.x, p.y, 3, 0, TAU);
          ctx.fillStyle = rgba(cyan, pe);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, TAU);
          ctx.strokeStyle = rgba(cyan, 0.5 * pe);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Retrieved top-k.
      if (env > 0 && topK[0] >= 0) {
        if (owner < 0) {
          labelChunk = topK[0];
          labelAlpha = env;
        }
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

      // What the nearest chunk stands for — the one bit of text on the canvas,
      // drawn last so nothing overlaps it, and gone when its query fades.
      const pool = labelsRef.current;
      if (labelChunk >= 0 && labelAlpha > 0 && pool && pool.length > 0) {
        const li = label[labelChunk];
        if (li >= 0 && li < pool.length) {
          const lx = px[labelChunk];
          const off = rad[labelChunk] + LABEL_GAP;
          // Near the right edge, hang the word off the other side of the dot
          // so it never runs off-canvas.
          const flip = lx > W - LABEL_FLIP;
          ctx.font = LABEL_FONT;
          ctx.textBaseline = 'middle';
          ctx.textAlign = flip ? 'right' : 'left';
          ctx.fillStyle = rgba(cyan, 0.7 * labelAlpha);
          ctx.fillText(pool[li], lx + (flip ? -off : off), py[labelChunk]);
          ctx.textAlign = 'left';
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

    // ── Interaction ─────────────────────────────────────────────────────────
    const addPin = (x: number, y: number, now: number) => {
      let live = 0;
      for (let i = 0; i < pins.length; i++) if (!pins[i].retiring) live++;
      if (live >= MAX_PINS) {
        const oldest = pins.findIndex((p) => !p.retiring);
        // Under reduced motion nothing repaints on a timer, so a fading pin
        // would hang around at full strength — drop it outright instead.
        if (reduced) pins.splice(oldest, 1);
        else pins[oldest].retiring = now;
      }
      const k = new Int32Array(K);
      computeTopK(x, y, k, pinD2);
      pins.push({ x, y, born: reduced ? 0 : now, retiring: 0, k });
      // Don't let the ambient query sweep in on top of the click.
      if (q.phase === 'idle') q.start = now;
      if (reduced) draw(performance.now()); // not drawStatic: keep q's phase
    };

    const target: HTMLElement = interactionRef?.current ?? canvas;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let downId = -1; // pointer whose press started inside the hero

    const onPointerDown = (e: PointerEvent) => {
      downId = e.button === 0 && e.isPrimary ? e.pointerId : -1;
      downX = e.clientX;
      downY = e.clientY;
      downT = e.timeStamp;
    };

    const onPointerCancel = () => {
      downId = -1;
    };

    const onPointerUp = (e: PointerEvent) => {
      // Must pair with a press that started here — a release that drifted in
      // from the fixed navbar above isn't a click on the field.
      if (e.pointerId !== downId || e.button !== 0) return;
      downId = -1;
      // A drag is a scroll or a text selection, not a click.
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_SLOP) return;
      if (e.timeStamp - downT > CLICK_MS) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      // Leave the CTAs and social links alone.
      const el = e.target as Element | null;
      if (el?.closest?.('a,button,input,textarea,select,[role="button"]')) return;
      // The wrapper fades out over the first stretch of scroll but still
      // hit-tests — don't pin queries onto an invisible field.
      const host = canvas.parentElement;
      if (host && Number(getComputedStyle(host).opacity) < HIDDEN_OPACITY) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      addPin(x, y, performance.now());
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
        // First run, or the copy column changed shape — reseed. Pinned queries
        // reference chunk indices that are about to mean something else.
        seed();
        pins.length = 0;
      } else {
        // Scale homes in place: no pop, and it absorbs mobile URL-bar resizes.
        const sx = W / prevW;
        const sy = H / prevH;
        for (let i = 0; i < N; i++) {
          homeX[i] *= sx;
          homeY[i] *= sy;
        }
        for (let i = 0; i < pins.length; i++) {
          pins[i].x *= sx;
          pins[i].y *= sy;
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
        // No timer left to finish their fades — drop them now.
        for (let i = pins.length - 1; i >= 0; i--) if (pins[i].retiring) pins.splice(i, 1);
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

    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerCancel);

    if (reduced) drawStatic();
    else start();

    return () => {
      stop();
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerCancel);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [interactionRef]);

  return (
    <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
  );
}

export default RetrievalField;
