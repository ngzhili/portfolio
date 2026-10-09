'use client';

/**
 * AgentTraceField — the hero background: an agent run, drawn.
 *
 * A small agent graph sits beside the hero copy:
 *
 *     query → plan → { tool, tool, tool … } → reflect → answer
 *               ↑__________ (dashed re-plan loop) ______|
 *
 * Every few seconds a run plays through it. A packet carries the user's query
 * to `plan`, which fans out parallel tool calls; results converge on
 * `reflect`, which sometimes finds a gap and loops back to re-plan before the
 * answer lands. A trace log under the graph streams each step as it happens,
 * the way an agent UI with live step streaming would show it.
 *
 * It's interactive like the retrieval field it can replace: clicking anywhere
 * in the hero retires the current run and starts a new one whose query flies
 * in from the click point.
 *
 * Canvas 2D on purpose, built on the same shell as RetrievalField: capped at
 * 30fps, a handful of small paths per frame, paused offscreen and in
 * background tabs, and a single static frame (a finished run) under
 * prefers-reduced-motion. Below the md breakpoint, or when the column beside
 * the copy is too narrow, the graph drops behind the copy, dimmed and unlabeled.
 */
import { useEffect, useRef, type RefObject } from 'react';

// ── Ambient dust (texture around the graph) ─────────────────────────────────
const N_DUST = 48;
const DUST_EDGE_D2 = 110 * 110;

const FPS_MIN_DT = 30; // ms between draws (~30fps)
const MAX_DPR = 1.5;
const TAU = Math.PI * 2;

// ── Run timeline, in ms ─────────────────────────────────────────────────────
const T_FIRST = 700; // pause before the first run after load
const T_IDLE = 1800; // between runs
const T_ENTER = 650; // click point → query
const T_HOP = 450; // packet along one edge
const T_THINK = 750; // plan / reflect "thinking"
const T_TOOL = 520; // a tool executing
const T_STAGGER = 110; // between parallel tool calls
const T_LOOP = 650; // reflect → plan along the dashed loop
const T_HOLD = 1700; // finished run stays on screen
const T_FADE = 900;
const T_CANCEL = 220; // a click retires the current run this fast
const T_PULSE = 650; // ring on node activation
const T_LIT_RAMP = 200;
const LOOP_P = 0.35; // chance a run finds a gap and re-plans
const TYPE_MS = 14; // per character in the trace log
const CURVE_STEPS = 14; // polyline steps for a partially lit edge
const ENTER_TAIL = 0.22; // a click's entry packet leaves only this much trail

// ── Pointer (same rules as RetrievalField) ──────────────────────────────────
const CLICK_SLOP = 6;
const CLICK_MS = 600;
const HIDDEN_OPACITY = 0.15;

// ── Layout ──────────────────────────────────────────────────────────────────
// Hero copy geometry: Container is max-w-6xl (1152) with px-8, the copy block
// inside it is max-w-3xl (768). The graph lives to the right of that column.
const CONTAINER_W = 1152;
const COPY_W = 768;
const COPY_PAD = 32;
const MD = 768;
const MIN_GRAPH_W = 300; // narrower than this beside the copy → narrow mode
const RIGHT_PAD = 32; // graph column's right margin
const MAX_GRAPH_W = 520;
const MIN_GRAPH_H = 240;
const MAX_GRAPH_H = 440;
const TOP = 104; // clears the fixed navbar
const BOTTOM = 40;
const LOG_LINES = 6;
const LINE_H = 17;
const LOG_GAP = 30; // graph bottom → log header
const LOG_H = LOG_GAP + (LOG_LINES + 1) * LINE_H;
const NARROW_SCALE = 0.42; // alpha multiplier when the graph sits behind copy
const LOOP_U = -0.46; // loop control point, box units — apex lands near u≈0.02

const FONT = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
const LOOP_DASH = [3, 4];
const NO_DASH: number[] = [];

// Node indices. Tools follow from T0.
const Q = 0;
const PLAN = 1;
const REFLECT = 2;
const ANSWER = 3;
const T0 = 4;

const DARK_ALPHA = {
  dust: 0.32,
  dustEdge: 0.07,
  edge: 0.24,
  node: 0.6,
  label: 0.55,
  lit: 0.95,
  litEdge: 0.6,
  log: 0.62,
  logHot: 0.95,
};
const LIGHT_ALPHA = {
  dust: 0.26,
  dustEdge: 0.06,
  edge: 0.22,
  node: 0.55,
  label: 0.75,
  lit: 0.9,
  litEdge: 0.5,
  log: 0.75,
  logHot: 0.95,
};

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
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const bez = (a: number, c: number, b: number, s: number) => {
  const m = 1 - s;
  return m * m * a + 2 * m * s * c + s * s * b;
};
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/** A packet's journey along one edge. `a` = -1 means "from the point (ox, oy)". */
type Seg = { a: number; b: number; ox: number; oy: number; at: number; dur: number };
/** A node lighting up. `think` shows the typing dots for T_THINK. */
type Act = { node: number; at: number; think: boolean };
type Line = { text: string; at: number };
type Run = {
  id: number;
  start: number; // ms timestamp; all `at`s are offsets from here
  segs: Seg[];
  acts: Act[];
  lines: Line[];
  settled: number; // offset by which the answer has landed and its pulse ended
  end: number; // offset at which the fade begins
  fadeAt: number; // ms timestamp the fade began; 0 = not fading
  fadeDur: number;
  envScale: number; // envelope the fade starts from (a click can cut a fade short)
};

export type AgentTraceFieldProps = {
  /**
   * Element to listen on for clicks — the hero <section>, as with
   * RetrievalField. Defaults to the canvas.
   */
  interactionRef?: RefObject<HTMLElement | null>;
  /** Tool node names. 3–5 short names (≤ 8 chars) lay out best. */
  tools: string[];
  /** Sample user requests the trace log quotes. */
  queries: string[];
};

export function AgentTraceField({ interactionRef, tools, queries }: AgentTraceFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The effect runs once; read the latest values through refs.
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const queriesRef = useRef(queries);
  queriesRef.current = queries;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ── Graph ───────────────────────────────────────────────────────────────
    const toolNames = (toolsRef.current?.length ? toolsRef.current : ['tool']).slice(0, 6);
    const NT = toolNames.length;
    const NN = T0 + NT;
    const names = ['query', 'plan', 'reflect', 'answer', ...toolNames];

    // Node layout in box units (0..1), radius, and label offset.
    const nodeU = new Float32Array(NN);
    const nodeV = new Float32Array(NN);
    const nodeR = new Float32Array(NN);
    const nodePh = new Float32Array(NN);
    const labDX = new Float32Array(NN);
    const labDY = new Float32Array(NN);
    const labW = new Float32Array(NN);
    const nx = new Float32Array(NN);
    const ny = new Float32Array(NN);
    const lit = new Float32Array(NN); // per frame, primary run
    const ring = new Float32Array(NN); // per frame: pulse progress, -1 = none
    const thinking = new Uint8Array(NN);

    const place = (i: number, u: number, v: number, r: number, dx: number, dy: number) => {
      nodeU[i] = u;
      nodeV[i] = v;
      nodeR[i] = r;
      labDX[i] = dx;
      labDY[i] = dy;
      nodePh[i] = Math.random() * TAU;
    };
    // Central spine: labels to the right, nudged off the edges that meet there.
    place(Q, 0.5, 0, 4, 12, 0);
    place(PLAN, 0.5, 0.22, 6, 12, -12);
    place(REFLECT, 0.5, 0.8, 6, 12, 13);
    place(ANSWER, 0.5, 1, 5, 12, 0);
    for (let i = 0; i < NT; i++) {
      // Start at 0.24 so the re-plan loop (apex ≈ 0.02) has room on the left.
      const u = NT === 1 ? 0.5 : 0.24 + (i * 0.6) / (NT - 1);
      place(T0 + i, u, i % 2 ? 0.56 : 0.48, 4.5, 10, 0);
    }

    // ── Dust ────────────────────────────────────────────────────────────────
    const homeX = new Float32Array(N_DUST);
    const homeY = new Float32Array(N_DUST);
    const ampX = new Float32Array(N_DUST);
    const ampY = new Float32Array(N_DUST);
    const freqX = new Float32Array(N_DUST);
    const freqY = new Float32Array(N_DUST);
    const phX = new Float32Array(N_DUST);
    const phY = new Float32Array(N_DUST);
    const rad = new Float32Array(N_DUST);
    const px = new Float32Array(N_DUST);
    const py = new Float32Array(N_DUST);

    // ── State ───────────────────────────────────────────────────────────────
    let W = 0;
    let H = 0;
    let wide = false; // graph has its own column beside the copy
    let copyEdge = 0;
    let bx = 0; // graph box
    let by = 0;
    let bw = 0;
    let bh = 0;
    let scale = 1; // alpha multiplier for the graph
    let charW = 6.6;
    let t = 0; // seconds of animated time (drift)
    let rafId = 0;
    let lastDraw = 0;
    let onScreen = true;
    let reduced = false;

    let run: Run | null = null;
    let ghost: Run | null = null; // the run a click just cut short
    let nextRunAt = 0;
    let runCount = 0;

    let accent: RGB = [139, 92, 246];
    let cyan: RGB = [34, 211, 238];
    let muted: RGB = [161, 161, 181];
    let alpha = DARK_ALPHA;

    const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    // ── Theme ───────────────────────────────────────────────────────────────
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      accent = parseHex(cs.getPropertyValue('--color-accent'), [139, 92, 246]);
      cyan = parseHex(cs.getPropertyValue('--color-cyan'), [34, 211, 238]);
      muted = parseHex(cs.getPropertyValue('--color-muted'), [161, 161, 181]);
      alpha = document.documentElement.classList.contains('light')
        ? LIGHT_ALPHA
        : DARK_ALPHA;
    };

    // ── Layout ──────────────────────────────────────────────────────────────
    const layout = () => {
      copyEdge =
        W >= MD ? Math.max(0, (W - CONTAINER_W) / 2) + COPY_PAD + COPY_W + 24 : 0;
      const region = W - RIGHT_PAD - copyEdge;
      wide = W >= MD && region >= MIN_GRAPH_W;
      if (wide) {
        bw = Math.min(region, MAX_GRAPH_W);
        bx = copyEdge + (region - bw) / 2;
        const avail = H - TOP - BOTTOM - LOG_H;
        bh = Math.max(MIN_GRAPH_H, Math.min(avail, MAX_GRAPH_H));
        by = TOP + Math.max(0, (avail - bh) / 2);
        scale = 1;
      } else {
        // Behind the copy: low in the hero, dimmed, no text. Centred on phones;
        // on tablets the copy is left-aligned, so keep to the right side.
        bw = Math.min(W - 64, 400);
        bx = W >= MD ? W - bw - RIGHT_PAD : (W - bw) / 2;
        bh = Math.min(H * 0.36, 300);
        by = H - bh - 64;
        scale = NARROW_SCALE;
      }
      ctx.font = FONT;
      charW = ctx.measureText('M').width || 6.6;
      for (let i = 0; i < NN; i++) labW[i] = ctx.measureText(names[i]).width;
    };

    const seedDust = () => {
      for (let i = 0; i < N_DUST; i++) {
        // Thin out behind the copy and inside the graph, so neither fights it.
        let x = 0;
        let y = 0;
        for (let tries = 0; tries < 12; tries++) {
          x = -20 + Math.random() * (W + 40);
          y = -20 + Math.random() * (H + 40);
          const behindCopy = x < copyEdge;
          // Graph box plus the trace log under it.
          const inGraph =
            wide && x > bx - 20 && x < W && y > by - 20 && y < by + bh + LOG_H + 10;
          if (!behindCopy && !inGraph) break;
          if (Math.random() < 0.25) break;
        }
        homeX[i] = x;
        homeY[i] = y;
        ampX[i] = 8 + Math.random() * 12;
        ampY[i] = 8 + Math.random() * 12;
        freqX[i] = 0.15 + Math.random() * 0.25;
        freqY[i] = 0.15 + Math.random() * 0.25;
        phX[i] = Math.random() * TAU;
        phY[i] = Math.random() * TAU;
        rad[i] = 1.1 + Math.random() * 0.8;
      }
    };

    // ── Edge geometry ───────────────────────────────────────────────────────
    // Scratch endpoints/control point for the edge being drawn; no allocation.
    let AX = 0;
    let AY = 0;
    let BX = 0;
    let BY = 0;
    let CX = 0;
    let CY = 0;
    const geom = (a: number, b: number, ox: number, oy: number) => {
      if (a < 0) {
        AX = ox;
        AY = oy;
      } else {
        AX = nx[a];
        AY = ny[a];
      }
      BX = nx[b];
      BY = ny[b];
      if (a === REFLECT && b === PLAN) {
        // The re-plan loop bows out to the left of the tool row.
        CX = bx + LOOP_U * bw;
        CY = (AY + BY) / 2;
      } else if (a === PLAN && b >= T0) {
        // Fan out: leave plan at an angle, arrive at the tool from above.
        CX = BX;
        CY = AY + (BY - AY) * 0.35;
      } else if (a >= T0 && b === REFLECT) {
        CX = AX;
        CY = BY - (BY - AY) * 0.35;
      } else {
        CX = (AX + BX) / 2;
        CY = (AY + BY) / 2;
      }
    };
    const pathFull = () => {
      ctx.moveTo(AX, AY);
      ctx.quadraticCurveTo(CX, CY, BX, BY);
    };
    /** The stretch of the current edge between curve parameters p0 and p1. */
    const pathPartial = (p1: number, p0 = 0) => {
      ctx.moveTo(bez(AX, CX, BX, p0), bez(AY, CY, BY, p0));
      const steps = Math.max(2, Math.ceil(CURVE_STEPS * (p1 - p0)));
      for (let k = 1; k <= steps; k++) {
        const s = p0 + (k / steps) * (p1 - p0);
        ctx.lineTo(bez(AX, CX, BX, s), bez(AY, CY, BY, s));
      }
    };

    // ── Runs ────────────────────────────────────────────────────────────────
    const latency = () => 60 + Math.floor(Math.random() * 340);

    const buildRun = (now: number, fromClick: boolean, ox: number, oy: number): Run => {
      const segs: Seg[] = [];
      const acts: Act[] = [];
      const lines: Line[] = [];
      const seg = (a: number, b: number, at: number, dur: number) =>
        segs.push({ a, b, ox: 0, oy: 0, at, dur });
      const pool = queriesRef.current?.length ? queriesRef.current : ['help me with this'];
      const query = pool[Math.floor(Math.random() * pool.length)];

      let c = 0;
      if (fromClick) {
        segs.push({ a: -1, b: Q, ox, oy, at: 0, dur: T_ENTER });
        c += T_ENTER;
      }
      acts.push({ node: Q, at: c, think: false });
      lines.push({ text: `› user     "${clip(query, 34)}"`, at: c });
      c += 300;
      seg(Q, PLAN, c, T_HOP);
      c += T_HOP;

      // Parallel tool calls: 2–3 distinct tools, left to right.
      const order = Array.from({ length: NT }, (_, i) => i);
      for (let i = NT - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const n = Math.min(NT, Math.random() < 0.5 ? 2 : 3);
      const picks = order.slice(0, n).sort((x, y) => x - y);

      acts.push({ node: PLAN, at: c, think: true });
      lines.push({ text: `› plan     → ${picks.map((i) => toolNames[i]).join(', ')}`, at: c });
      c += T_THINK;
      picks.forEach((ti, k) => {
        const s = c + k * T_STAGGER;
        seg(PLAN, T0 + ti, s, T_HOP);
        acts.push({ node: T0 + ti, at: s + T_HOP, think: false });
        lines.push({
          text: `  ↳ ${toolNames[ti]}()  ${latency()}ms`,
          at: s + T_HOP + T_TOOL * 0.6,
        });
      });
      c += (n - 1) * T_STAGGER + T_HOP + T_TOOL;
      picks.forEach((ti, k) => seg(T0 + ti, REFLECT, c + k * T_STAGGER, T_HOP));
      c += (n - 1) * T_STAGGER + T_HOP;
      acts.push({ node: REFLECT, at: c, think: true });

      // Sometimes reflection finds a gap and the agent re-plans once.
      if (NT > n && Math.random() < LOOP_P) {
        const extra = order[n];
        lines.push({ text: '› reflect  gap found → re-plan', at: c });
        c += T_THINK;
        seg(REFLECT, PLAN, c, T_LOOP);
        c += T_LOOP;
        acts.push({ node: PLAN, at: c, think: true });
        lines.push({ text: `› plan     → ${toolNames[extra]}`, at: c });
        c += T_THINK * 0.6;
        seg(PLAN, T0 + extra, c, T_HOP);
        c += T_HOP;
        acts.push({ node: T0 + extra, at: c, think: false });
        lines.push({ text: `  ↳ ${toolNames[extra]}()  ${latency()}ms`, at: c + T_TOOL * 0.6 });
        c += T_TOOL;
        seg(T0 + extra, REFLECT, c, T_HOP);
        c += T_HOP;
        acts.push({ node: REFLECT, at: c, think: true });
      }
      lines.push({ text: '› reflect  grounded ✓', at: c });
      c += T_THINK;
      seg(REFLECT, ANSWER, c, T_HOP);
      c += T_HOP;
      acts.push({ node: ANSWER, at: c, think: false });
      lines.push({
        text: `› answer   streamed · ${2 + Math.floor(Math.random() * 3)} citations`,
        at: c,
      });

      return {
        id: ++runCount,
        start: now,
        segs,
        acts,
        lines,
        settled: c + T_PULSE + 1,
        end: c + T_HOLD,
        fadeAt: 0,
        fadeDur: T_FADE,
        envScale: 1,
      };
    };

    /** Jump a run to its finished state — the reduced-motion picture. */
    const settle = (r: Run, now: number) => {
      r.start = now - r.settled;
      return r;
    };

    const envOf = (r: Run, now: number) =>
      r.fadeAt === 0
        ? r.envScale
        : r.envScale * Math.max(0, 1 - (now - r.fadeAt) / r.fadeDur);

    // ── Draw ────────────────────────────────────────────────────────────────
    /** Lit trails and lit nodes for one run. Pulses/packets only for the primary. */
    const drawRun = (r: Run, now: number, env: number, primary: boolean) => {
      const el = now - r.start;
      const a = env * scale;

      // Lit trails, drawn up to each packet's current position.
      ctx.beginPath();
      for (let i = 0; i < r.segs.length; i++) {
        const s = r.segs[i];
        if (el < s.at || (s.a === REFLECT && s.b === PLAN)) continue;
        geom(s.a, s.b, s.ox, s.oy);
        const p = easeInOutCubic(Math.min(1, (el - s.at) / s.dur));
        if (s.a < 0) {
          // A click's entry: a short comet tail, gone once it lands, so it
          // doesn't leave a line slashed across the graph.
          if (p < 1) pathPartial(p, Math.max(0, p - ENTER_TAIL));
        } else {
          pathPartial(p);
        }
      }
      ctx.strokeStyle = rgba(cyan, alpha.litEdge * a);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash(LOOP_DASH);
      ctx.beginPath();
      for (let i = 0; i < r.segs.length; i++) {
        const s = r.segs[i];
        if (el < s.at || !(s.a === REFLECT && s.b === PLAN)) continue;
        geom(s.a, s.b, s.ox, s.oy);
        pathPartial(easeInOutCubic(Math.min(1, (el - s.at) / s.dur)));
      }
      ctx.stroke();
      ctx.setLineDash(NO_DASH);

      // Node state from the activations so far.
      for (let i = 0; i < NN; i++) {
        lit[i] = 0;
        ring[i] = -1;
        thinking[i] = 0;
      }
      for (let i = 0; i < r.acts.length; i++) {
        const act = r.acts[i];
        const since = el - act.at;
        if (since < 0) continue;
        lit[act.node] = Math.max(lit[act.node], Math.min(1, since / T_LIT_RAMP));
        if (since < T_PULSE) ring[act.node] = since / T_PULSE;
        if (act.think && since < T_THINK) thinking[act.node] = 1;
      }

      for (let i = 0; i < NN; i++) {
        if (lit[i] <= 0) continue;
        const la = lit[i] * a;
        ctx.beginPath();
        ctx.arc(nx[i], ny[i], nodeR[i] + 0.8, 0, TAU);
        ctx.fillStyle = rgba(cyan, alpha.lit * la);
        ctx.fill();
        if (i === PLAN || i === REFLECT || i === ANSWER) {
          ctx.beginPath();
          ctx.arc(nx[i], ny[i], nodeR[i] + 4, 0, TAU);
          ctx.strokeStyle = rgba(cyan, 0.7 * la);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (i === ANSWER) {
          ctx.beginPath();
          ctx.arc(nx[i], ny[i], nodeR[i] + 9, 0, TAU);
          ctx.strokeStyle = rgba(cyan, 0.3 * la);
          ctx.stroke();
        }
      }
      if (!primary) return;

      // Activation pulses.
      for (let i = 0; i < NN; i++) {
        if (ring[i] < 0) continue;
        const p = ring[i];
        ctx.beginPath();
        ctx.arc(nx[i], ny[i], nodeR[i] + 4 + 16 * easeOutCubic(p), 0, TAU);
        ctx.strokeStyle = rgba(cyan, 0.5 * (1 - p) * a);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Packets in flight.
      for (let i = 0; i < r.segs.length; i++) {
        const s = r.segs[i];
        if (el < s.at || el >= s.at + s.dur) continue;
        geom(s.a, s.b, s.ox, s.oy);
        const p = easeInOutCubic((el - s.at) / s.dur);
        const x = bez(AX, CX, BX, p);
        const y = bez(AY, CY, BY, p);
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, TAU);
        ctx.fillStyle = rgba(cyan, a);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, TAU);
        ctx.strokeStyle = rgba(cyan, 0.4 * a);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const drawLabels = (env: number, now: number) => {
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      for (let i = 0; i < NN; i++) {
        const x = nx[i] + labDX[i];
        const y = ny[i] + labDY[i];
        const l = lit[i] * env;
        if (l < 1) {
          ctx.fillStyle = rgba(muted, alpha.label * (1 - l));
          ctx.fillText(names[i], x, y);
        }
        if (l > 0) {
          ctx.fillStyle = rgba(cyan, 0.95 * l);
          ctx.fillText(names[i], x, y);
        }
        // Typing dots while plan / reflect are thinking.
        if (thinking[i] && env > 0) {
          for (let d = 0; d < 3; d++) {
            const on = 0.35 + 0.65 * Math.max(0, Math.sin(now / 140 - d * 0.9));
            ctx.beginPath();
            ctx.arc(x + labW[i] + 7 + d * 5, y + 1, 1.3, 0, TAU);
            ctx.fillStyle = rgba(cyan, on * env);
            ctx.fill();
          }
        }
      }
    };

    const drawLog = (r: Run, now: number, env: number) => {
      const el = now - r.start;
      const lx = bx;
      const ly = by + bh + LOG_GAP;
      const maxChars = Math.max(8, Math.floor((W - 24 - lx) / charW));
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      const secs = (Math.max(0, Math.min(el, r.end)) / 1000).toFixed(1);
      ctx.fillStyle = rgba(muted, alpha.log * 0.6 * env);
      ctx.fillText(`trace · run ${String(r.id).padStart(3, '0')} · ${secs}s`, lx, ly);

      let count = 0;
      while (count < r.lines.length && r.lines[count].at <= el) count++;
      const first = Math.max(0, count - LOG_LINES);
      for (let i = first; i < count; i++) {
        const ln = r.lines[i];
        const y = ly + (i - first + 1) * LINE_H;
        const newest = i === count - 1;
        const chars = Math.min(ln.text.length, maxChars, Math.floor((el - ln.at) / TYPE_MS));
        ctx.fillStyle = newest
          ? rgba(cyan, alpha.logHot * env)
          : rgba(muted, alpha.log * env);
        ctx.fillText(ln.text.slice(0, chars), lx, y);
        // Cursor: solid while typing, blinking after, gone once the run fades.
        if (newest && r.fadeAt === 0 && (chars < ln.text.length || Math.floor(now / 500) % 2 === 0)) {
          ctx.fillRect(lx + chars * charW + 2, y - 5, 5, 10);
        }
      }
    };

    const draw = (now: number) => {
      // Run lifecycle.
      if (!reduced) {
        if (!run && now >= nextRunAt) run = buildRun(now, false, 0, 0);
        if (run && run.fadeAt === 0 && now - run.start >= run.end) run.fadeAt = now;
        if (run && run.fadeAt !== 0 && envOf(run, now) <= 0) {
          run = null;
          nextRunAt = now + T_IDLE;
        }
        if (ghost && envOf(ghost, now) <= 0) ghost = null;
      }

      // Node positions: a slight breathing drift so the graph feels alive.
      for (let i = 0; i < NN; i++) {
        nx[i] = bx + nodeU[i] * bw + 2 * Math.sin(t * 0.7 + nodePh[i]);
        ny[i] = by + nodeV[i] * bh + 2 * Math.cos(t * 0.55 + nodePh[i] * 1.3);
      }
      for (let i = 0; i < N_DUST; i++) {
        px[i] = homeX[i] + ampX[i] * Math.sin(t * freqX[i] + phX[i]);
        py[i] = homeY[i] + ampY[i] * Math.sin(t * freqY[i] + phY[i]);
      }

      ctx.clearRect(0, 0, W, H);

      // Dust and its faint neighbour edges.
      ctx.beginPath();
      for (let i = 0; i < N_DUST; i++) {
        for (let j = i + 1; j < N_DUST; j++) {
          const dx = px[j] - px[i];
          const dy = py[j] - py[i];
          if (dx * dx + dy * dy < DUST_EDGE_D2) {
            ctx.moveTo(px[i], py[i]);
            ctx.lineTo(px[j], py[j]);
          }
        }
      }
      ctx.strokeStyle = rgba(accent, alpha.dustEdge);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < N_DUST; i++) {
        ctx.moveTo(px[i] + rad[i], py[i]);
        ctx.arc(px[i], py[i], rad[i], 0, TAU);
      }
      ctx.fillStyle = rgba(accent, alpha.dust);
      ctx.fill();

      // Resting graph: one path for the edges, one for the dashed loop.
      ctx.beginPath();
      geom(Q, PLAN, 0, 0);
      pathFull();
      for (let i = T0; i < NN; i++) {
        geom(PLAN, i, 0, 0);
        pathFull();
        geom(i, REFLECT, 0, 0);
        pathFull();
      }
      geom(REFLECT, ANSWER, 0, 0);
      pathFull();
      ctx.strokeStyle = rgba(accent, alpha.edge * scale);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash(LOOP_DASH);
      ctx.beginPath();
      geom(REFLECT, PLAN, 0, 0);
      pathFull();
      ctx.strokeStyle = rgba(accent, alpha.edge * 0.8 * scale);
      ctx.stroke();
      ctx.setLineDash(NO_DASH);

      // Resting nodes; plan / reflect / answer get a ring (they're model calls).
      ctx.beginPath();
      for (let i = 0; i < NN; i++) {
        ctx.moveTo(nx[i] + nodeR[i], ny[i]);
        ctx.arc(nx[i], ny[i], nodeR[i], 0, TAU);
      }
      ctx.fillStyle = rgba(accent, alpha.node * scale);
      ctx.fill();
      ctx.beginPath();
      for (const i of [PLAN, REFLECT, ANSWER]) {
        ctx.moveTo(nx[i] + nodeR[i] + 4, ny[i]);
        ctx.arc(nx[i], ny[i], nodeR[i] + 4, 0, TAU);
      }
      ctx.strokeStyle = rgba(accent, alpha.node * 0.6 * scale);
      ctx.lineWidth = 1;
      ctx.stroke();

      if (ghost) drawRun(ghost, now, envOf(ghost, now), false);
      let env = 0;
      if (run) {
        env = envOf(run, now);
        drawRun(run, now, env, true); // also fills lit / ring / thinking
      } else {
        lit.fill(0);
        thinking.fill(0);
      }

      if (wide) {
        drawLabels(env, now);
        if (run && !reduced) drawLog(run, now, env);
      }
    };

    // ── Loop ────────────────────────────────────────────────────────────────
    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame);
      if (now - lastDraw < FPS_MIN_DT) return;
      const dt = Math.min(now - lastDraw, 100);
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
    /** One frame of a finished run — the reduced-motion resting state. */
    const drawStatic = () => {
      const now = performance.now();
      if (!run) run = settle(buildRun(now, false, 0, 0), now);
      run.fadeAt = 0;
      run.envScale = 1;
      ghost = null;
      draw(now);
    };

    // ── Interaction ─────────────────────────────────────────────────────────
    const launch = (x: number, y: number, now: number) => {
      if (reduced) {
        run = settle(buildRun(now, true, x, y), now);
        ghost = null;
        draw(now);
        return;
      }
      if (run) {
        const e = envOf(run, now);
        if (e > 0) {
          run.envScale = e;
          run.fadeAt = now;
          run.fadeDur = T_CANCEL;
          ghost = run;
        }
      }
      run = buildRun(now, true, x, y);
    };

    const target: HTMLElement = interactionRef?.current ?? canvas;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let downId = -1;

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
      if (e.pointerId !== downId || e.button !== 0) return;
      downId = -1;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_SLOP) return;
      if (e.timeStamp - downT > CLICK_MS) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      const el = e.target as Element | null;
      if (el?.closest?.('a,button,input,textarea,select,[role="button"]')) return;
      const host = canvas.parentElement;
      if (host && Number(getComputedStyle(host).opacity) < HIDDEN_OPACITY) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      launch(x, y, performance.now());
    };

    // ── Sizing ──────────────────────────────────────────────────────────────
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wasWide = wide;
      const prevW = W;
      const prevH = H;
      W = w;
      H = h;
      layout();
      if (prevW === 0 || wide !== wasWide) {
        seedDust();
      } else {
        const sx = W / prevW;
        const sy = H / prevH;
        for (let i = 0; i < N_DUST; i++) {
          homeX[i] *= sx;
          homeY[i] *= sy;
        }
      }
      if (reduced) drawStatic();
    };

    // ── Wiring ──────────────────────────────────────────────────────────────
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = motionQuery.matches;
    nextRunAt = performance.now() + T_FIRST;

    readTheme();
    resize();

    const onMotionChange = () => {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        run = null;
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

export default AgentTraceField;
