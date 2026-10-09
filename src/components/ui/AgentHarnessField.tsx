'use client';

/**
 * AgentHarnessField — the hero background: an agent run *inside its harness*.
 *
 * Same loop as AgentTraceField (query → plan → calls → reflect → answer, with
 * an occasional re-plan), plus the parts of the harness around it:
 *
 *                     query          memory ◀╮
 *                       │      ┌╌╌╌╌╌╌╯      ╎
 *                     plan ◀╌╌╌╯             ╎  memory: read before planning,
 *              ╭╌╌╌╌ ╱  │  ╲                 ╎  written back after answering
 *              ╎ ┌ sandbox ──┐   ◎ sub-agent  ╎
 *     re-plan  ╎ │ tool  tool │      │        ╎
 *              ╎ └────────────┘      │        ╎
 *              ╰╌╌▶ reflect ◀────────╯        ╎
 *                  eval ✓│                    ╎
 *                     answer ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
 *
 * - Tools load on demand: two tool slots live in a sandbox, filled from a
 *   larger pool. When a run needs a tool that isn't loaded, it searches the
 *   registry and the least-recently-used slot swaps to the new tool.
 * - One call can go to a sub-agent, which runs a small loop of its own
 *   (three orbiting steps) before reporting back — multi-agent in one node.
 * - Reflect runs an eval before the answer ships; the trace header counts
 *   elapsed time and tokens, the observability side of the harness.
 *
 * Shell (sizing, theme, observers, pointer handling, reduced motion, 30fps cap)
 * matches AgentTraceField; see that file for the reasoning behind each piece.
 */
import { useEffect, useRef, type RefObject } from 'react';

const N_DUST = 44;
const DUST_EDGE_D2 = 110 * 110;
const FPS_MIN_DT = 30;
const MAX_DPR = 1.5;
const TAU = Math.PI * 2;

// ── Run timeline, ms ────────────────────────────────────────────────────────
const T_FIRST = 700;
const T_IDLE = 1800;
const T_ENTER = 650;
const T_HOP = 450;
const T_THINK = 800;
const T_TOOL = 520;
const T_SUB = 1400; // a sub-agent runs its own loop, so it takes longer
const T_STAGGER = 120;
const T_LOOP = 650;
const T_SWAP = 650; // registry lookup + slot swap
const T_RAIL = 1000; // answer → memory write-back
const T_HOLD = 1800;
const T_FADE = 900;
const T_CANCEL = 220;
const T_PULSE = 650;
const T_LIT_RAMP = 200;
const LOOP_P = 0.25;
const SWAP_P = 0.5;
const SUB_P = 0.45;
const TYPE_MS = 14;
const CURVE_STEPS = 16;
const ENTER_TAIL = 0.22;

// ── Pointer ─────────────────────────────────────────────────────────────────
const CLICK_SLOP = 6;
const CLICK_MS = 600;
const HIDDEN_OPACITY = 0.15;

// ── Layout ──────────────────────────────────────────────────────────────────
const CONTAINER_W = 1152;
const COPY_W = 768;
const COPY_PAD = 32;
const MD = 768;
const MIN_GRAPH_W = 300;
const MAX_GRAPH_W = 520;
const MIN_GRAPH_H = 260;
const MAX_GRAPH_H = 440;
const RIGHT_PAD = 40; // room for the memory rail, which bows just past the box
const TOP = 104;
const BOTTOM = 40;
const LOG_LINES = 6;
const LINE_H = 17;
const LOG_GAP = 30;
const LOG_H = LOG_GAP + (LOG_LINES + 1) * LINE_H;
const NARROW_SCALE = 0.42;
const LOOP_U = -0.42; // re-plan loop control point (apex ≈ u 0.02)
const RAIL_U = 1.14; // memory rail control points (apex ≈ u 1.02)
// Sandbox box around the tool slots, in box units.
const SB = { u0: 0.08, u1: 0.66, v0: 0.39, v1: 0.67 };

const FONT = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
const LOOP_DASH = [3, 4];
const HARNESS_DASH = [1, 4];
const SB_DASH = [4, 4];
const NO_DASH: number[] = [];

// Nodes. Tool slots follow from T0.
const Q = 0;
const PLAN = 1;
const REFLECT = 2;
const ANSWER = 3;
const MEM = 4;
const SUB = 5;
const T0 = 6;
const N_SLOTS = 2;
const NN = T0 + N_SLOTS;
const isTarget = (i: number) => i === SUB || i >= T0;
const isSlot = (i: number) => i >= T0;

const DARK_ALPHA = {
  dust: 0.3,
  dustEdge: 0.06,
  edge: 0.24,
  harness: 0.3,
  node: 0.6,
  label: 0.55,
  lit: 0.95,
  litEdge: 0.6,
  log: 0.62,
  logHot: 0.95,
};
const LIGHT_ALPHA = {
  dust: 0.24,
  dustEdge: 0.05,
  edge: 0.22,
  harness: 0.3,
  node: 0.55,
  label: 0.75,
  lit: 0.9,
  litEdge: 0.5,
  log: 0.75,
  logHot: 0.95,
};

type RGB = [number, number, number];

function parseHex(hex: string, fallback: RGB): RGB {
  const h = hex.trim().replace('#', '');
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return fallback;
}

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const bez3 = (a: number, c1: number, c2: number, b: number, s: number) => {
  const m = 1 - s;
  return m * m * m * a + 3 * m * m * s * c1 + 3 * m * s * s * c2 + s * s * s * b;
};
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

type Seg = { a: number; b: number; ox: number; oy: number; at: number; dur: number };
type Act = { node: number; at: number; think: boolean };
type Line = { text: string; at: number };
type Swap = { slot: number; name: string; at: number; applied: boolean };
type Run = {
  id: number;
  start: number;
  segs: Seg[];
  acts: Act[];
  lines: Line[];
  swaps: Swap[];
  evalAt: number; // offset the eval badge appears; -1 = none
  settled: number;
  end: number;
  fadeAt: number;
  fadeDur: number;
  envScale: number;
};

export type AgentHarnessFieldProps = {
  interactionRef?: RefObject<HTMLElement | null>;
  /** Tool pool. Two are loaded at a time; the rest load on demand. ≤ 8 chars each. */
  tools: string[];
  /** Name the trace log gives the sub-agent. */
  subagent: string;
  /** Sample user requests the trace log quotes. */
  queries: string[];
};

export function AgentHarnessField({
  interactionRef,
  tools,
  subagent,
  queries,
}: AgentHarnessFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const queriesRef = useRef(queries);
  queriesRef.current = queries;
  const subRef = useRef(subagent);
  subRef.current = subagent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ── Graph ───────────────────────────────────────────────────────────────
    const pool = toolsRef.current.length >= N_SLOTS ? toolsRef.current : ['retrieve', 'search', 'run_code'];

    const nodeU = new Float32Array(NN);
    const nodeV = new Float32Array(NN);
    const nodeR = new Float32Array(NN);
    const nodePh = new Float32Array(NN);
    const labDX = new Float32Array(NN);
    const labDY = new Float32Array(NN);
    const labRight = new Uint8Array(NN); // 1 = right-aligned (label hangs left)
    const labW = new Float32Array(NN);
    const nx = new Float32Array(NN);
    const ny = new Float32Array(NN);
    const lit = new Float32Array(NN);
    const ring = new Float32Array(NN);
    const thinking = new Uint8Array(NN);
    let subOrbit = -1; // 0..1 progress of the sub-agent's own loop, -1 = idle
    let sandboxLit = 0;

    // Slot state persists across runs: which tool each slot holds, and when it
    // last swapped (for the label cross-fade and loading ring).
    const slotName: string[] = [pool[0], pool[1]];
    const slotPrev: string[] = ['', ''];
    const slotSwapAt = [-1e9, -1e9];
    const slotUsed = [0, 0];

    const names = ['query', 'plan', 'reflect', 'answer', 'memory', 'sub-agent'];
    const nameOf = (i: number) => (isSlot(i) ? slotName[i - T0] : names[i]);

    const place = (
      i: number,
      u: number,
      v: number,
      r: number,
      dx: number,
      dy: number,
      right = false
    ) => {
      nodeU[i] = u;
      nodeV[i] = v;
      nodeR[i] = r;
      labDX[i] = dx;
      labDY[i] = dy;
      labRight[i] = right ? 1 : 0;
      nodePh[i] = Math.random() * TAU;
    };
    place(Q, 0.46, 0, 4, 12, 0);
    place(MEM, 0.86, 0.07, 5, -12, 0, true);
    place(PLAN, 0.46, 0.22, 6, 12, -12);
    place(T0, 0.22, 0.5, 4.5, 10, 0);
    place(T0 + 1, 0.46, 0.55, 4.5, 10, 0);
    place(SUB, 0.76, 0.5, 5.5, 12, 0);
    place(REFLECT, 0.46, 0.8, 6, 12, 13);
    place(ANSWER, 0.46, 1, 5, -20, 0, true); // left (clear of its outer ring): the memory rail leaves rightwards

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
    let wide = false;
    let copyEdge = 0;
    let bx = 0;
    let by = 0;
    let bw = 0;
    let bh = 0;
    let scale = 1;
    let charW = 6.6;
    let t = 0;
    let rafId = 0;
    let lastDraw = 0;
    let onScreen = true;
    let reduced = false;

    let run: Run | null = null;
    let ghost: Run | null = null;
    let nextRunAt = 0;
    let runCount = 0;

    let accent: RGB = [139, 92, 246];
    let cyan: RGB = [34, 211, 238];
    let muted: RGB = [161, 161, 181];
    let alpha = DARK_ALPHA;
    const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      accent = parseHex(cs.getPropertyValue('--color-accent'), [139, 92, 246]);
      cyan = parseHex(cs.getPropertyValue('--color-cyan'), [34, 211, 238]);
      muted = parseHex(cs.getPropertyValue('--color-muted'), [161, 161, 181]);
      alpha = document.documentElement.classList.contains('light') ? LIGHT_ALPHA : DARK_ALPHA;
    };

    const layout = () => {
      copyEdge = W >= MD ? Math.max(0, (W - CONTAINER_W) / 2) + COPY_PAD + COPY_W + 24 : 0;
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
        bw = Math.min(W - 80, 400);
        bx = W >= MD ? W - bw - RIGHT_PAD : (W - bw) / 2 - 8;
        bh = Math.min(H * 0.38, 300);
        by = H - bh - 64;
        scale = NARROW_SCALE;
      }
      ctx.font = FONT;
      charW = ctx.measureText('M').width || 6.6;
      for (let i = 0; i < T0; i++) labW[i] = ctx.measureText(names[i]).width;
    };

    const seedDust = () => {
      for (let i = 0; i < N_DUST; i++) {
        let x = 0;
        let y = 0;
        for (let tries = 0; tries < 12; tries++) {
          x = -20 + Math.random() * (W + 40);
          y = -20 + Math.random() * (H + 40);
          const behindCopy = x < copyEdge;
          const inGraph = wide && x > bx - 20 && x < W && y > by - 20 && y < by + bh + LOG_H + 10;
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

    // ── Edge geometry (everything as a cubic; quadratics are converted) ─────
    let AX = 0;
    let AY = 0;
    let BX = 0;
    let BY = 0;
    let C1X = 0;
    let C1Y = 0;
    let C2X = 0;
    let C2Y = 0;
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
      if (a === ANSWER && b === MEM) {
        // Write-back rail: out to the right of the graph and up to memory.
        const rx = bx + RAIL_U * bw;
        C1X = rx;
        C1Y = AY;
        C2X = rx;
        C2Y = BY;
        return;
      }
      let qx: number;
      let qy: number;
      if (a === REFLECT && b === PLAN) {
        qx = bx + LOOP_U * bw;
        qy = (AY + BY) / 2;
      } else if (a === MEM && b === PLAN) {
        qx = AX;
        qy = BY;
      } else if (a === PLAN && isTarget(b)) {
        qx = BX;
        qy = AY + (BY - AY) * 0.35;
      } else if (isTarget(a) && b === REFLECT) {
        qx = AX;
        qy = BY - (BY - AY) * 0.35;
      } else {
        qx = (AX + BX) / 2;
        qy = (AY + BY) / 2;
      }
      C1X = AX + (2 / 3) * (qx - AX);
      C1Y = AY + (2 / 3) * (qy - AY);
      C2X = BX + (2 / 3) * (qx - BX);
      C2Y = BY + (2 / 3) * (qy - BY);
    };
    const pathFull = () => {
      ctx.moveTo(AX, AY);
      ctx.bezierCurveTo(C1X, C1Y, C2X, C2Y, BX, BY);
    };
    const pathPartial = (p1: number, p0 = 0) => {
      ctx.moveTo(bez3(AX, C1X, C2X, BX, p0), bez3(AY, C1Y, C2Y, BY, p0));
      const steps = Math.max(2, Math.ceil(CURVE_STEPS * (p1 - p0)));
      for (let k = 1; k <= steps; k++) {
        const s = p0 + (k / steps) * (p1 - p0);
        ctx.lineTo(bez3(AX, C1X, C2X, BX, s), bez3(AY, C1Y, C2Y, BY, s));
      }
    };
    /** 0 = solid loop edge, 1 = dashed re-plan loop, 2 = dotted harness (memory). */
    const edgeKind = (a: number, b: number) =>
      a === REFLECT && b === PLAN ? 1 : a === MEM || b === MEM ? 2 : 0;

    // ── Runs ────────────────────────────────────────────────────────────────
    const latency = () => 60 + Math.floor(Math.random() * 340);

    const buildRun = (now: number, fromClick: boolean, ox: number, oy: number): Run => {
      const segs: Seg[] = [];
      const acts: Act[] = [];
      const lines: Line[] = [];
      const swaps: Swap[] = [];
      const seg = (a: number, b: number, at: number, dur: number) =>
        segs.push({ a, b, ox: 0, oy: 0, at, dur });
      const id = ++runCount;
      const qs = queriesRef.current?.length ? queriesRef.current : ['help me with this'];
      const sub = subRef.current || 'researcher';

      let c = 0;
      if (fromClick) {
        segs.push({ a: -1, b: Q, ox, oy, at: 0, dur: T_ENTER });
        c += T_ENTER;
      }
      acts.push({ node: Q, at: c, think: false });
      lines.push({ text: `› user     "${clip(pick(qs), 34)}"`, at: c });
      c += 250;

      // Recall from memory while the query reaches plan.
      seg(Q, PLAN, c, T_HOP);
      seg(MEM, PLAN, c, T_HOP);
      acts.push({ node: MEM, at: c, think: false });
      lines.push({ text: `› memory   recall · ${1 + Math.floor(Math.random() * 3)} notes`, at: c + 120 });
      c += T_HOP;

      // Decide the calls: 1–2 tools, maybe the sub-agent.
      const useSub = Math.random() < SUB_P;
      const nTools = useSub ? (Math.random() < 0.4 ? 2 : 1) : 2;
      const toolSlots: number[] = [];
      let planWait = T_THINK;
      acts.push({ node: PLAN, at: c, think: true });
      const unloaded = pool.filter((n) => !slotName.includes(n));
      if (unloaded.length && Math.random() < SWAP_P) {
        // Load a tool on demand into the least-recently-used slot.
        const name = pick(unloaded);
        const slot = slotUsed[0] <= slotUsed[1] ? 0 : 1;
        const at = c + 220;
        swaps.push({ slot, name, at, applied: false });
        lines.push({ text: `› tools    registry → +${name}`, at });
        toolSlots.push(slot);
        planWait = Math.max(T_THINK, 220 + T_SWAP + 120);
      }
      // What each slot will hold once this run's tool load lands.
      const loaded = [...slotName];
      for (const s of swaps) loaded[s.slot] = s.name;
      while (toolSlots.length < nTools) {
        const other = toolSlots.length === 0 ? (Math.random() < 0.5 ? 0 : 1) : 1 - toolSlots[0];
        toolSlots.push(other);
      }
      toolSlots.sort((x, y) => x - y);
      toolSlots.forEach((s) => (slotUsed[s] = id));
      const targets = toolSlots.map((s) => T0 + s);
      if (useSub) targets.push(SUB);

      c += planWait;
      lines.push({
        text: `› plan     → ${targets.map((n) => (n === SUB ? sub : loaded[n - T0])).join(', ')}`,
        at: c - 80,
      });

      // Parallel calls; each returns to reflect when it finishes.
      let back = c;
      targets.forEach((n, k) => {
        const s = c + k * T_STAGGER;
        const dur = n === SUB ? T_SUB : T_TOOL;
        seg(PLAN, n, s, T_HOP);
        acts.push({ node: n, at: s + T_HOP, think: false });
        lines.push({
          text:
            n === SUB
              ? `  ↳ ${sub} (sub-agent) · 3 steps`
              : `  ↳ ${loaded[n - T0]}()  ${latency()}ms`,
          at: s + T_HOP + dur * 0.6,
        });
        seg(n, REFLECT, s + T_HOP + dur, T_HOP);
        back = Math.max(back, s + T_HOP + dur + T_HOP);
      });
      c = back;
      acts.push({ node: REFLECT, at: c, think: true });

      if (Math.random() < LOOP_P) {
        lines.push({ text: '› reflect  gap found → re-plan', at: c });
        c += T_THINK;
        seg(REFLECT, PLAN, c, T_LOOP);
        c += T_LOOP;
        const slot = Math.random() < 0.5 ? 0 : 1;
        acts.push({ node: PLAN, at: c, think: true });
        lines.push({ text: `› plan     → ${loaded[slot]}`, at: c });
        c += T_THINK * 0.6;
        seg(PLAN, T0 + slot, c, T_HOP);
        c += T_HOP;
        acts.push({ node: T0 + slot, at: c, think: false });
        lines.push({ text: `  ↳ ${loaded[slot]}()  ${latency()}ms`, at: c + T_TOOL * 0.6 });
        c += T_TOOL;
        seg(T0 + slot, REFLECT, c, T_HOP);
        c += T_HOP;
        acts.push({ node: REFLECT, at: c, think: true });
      }
      const evalAt = c + T_THINK * 0.55;
      lines.push({
        text: `› eval     faithfulness 0.${88 + Math.floor(Math.random() * 11)} ✓`,
        at: evalAt,
      });
      c += T_THINK;
      seg(REFLECT, ANSWER, c, T_HOP);
      c += T_HOP;
      acts.push({ node: ANSWER, at: c, think: false });
      lines.push({
        text: `› answer   streamed · ${2 + Math.floor(Math.random() * 3)} citations`,
        at: c,
      });
      c += 450;
      seg(ANSWER, MEM, c, T_RAIL);
      c += T_RAIL;
      acts.push({ node: MEM, at: c, think: false });
      lines.push({ text: '› memory   saved · 1 note', at: c });

      return {
        id,
        start: now,
        segs,
        acts,
        lines,
        swaps,
        evalAt,
        settled: c + T_PULSE + 1,
        end: c + T_HOLD,
        fadeAt: 0,
        fadeDur: T_FADE,
        envScale: 1,
      };
    };

    const settle = (r: Run, now: number) => {
      r.start = now - r.settled;
      return r;
    };
    const envOf = (r: Run, now: number) =>
      r.fadeAt === 0 ? r.envScale : r.envScale * Math.max(0, 1 - (now - r.fadeAt) / r.fadeDur);

    // ── Draw ────────────────────────────────────────────────────────────────
    const drawTrails = (r: Run, el: number, a: number) => {
      for (let kind = 0; kind < 3; kind++) {
        ctx.setLineDash(kind === 1 ? LOOP_DASH : kind === 2 ? HARNESS_DASH : NO_DASH);
        ctx.beginPath();
        for (let i = 0; i < r.segs.length; i++) {
          const s = r.segs[i];
          if (el < s.at || edgeKind(s.a, s.b) !== kind) continue;
          geom(s.a, s.b, s.ox, s.oy);
          const p = easeInOutCubic(Math.min(1, (el - s.at) / s.dur));
          if (s.a < 0) {
            if (p < 1) pathPartial(p, Math.max(0, p - ENTER_TAIL));
          } else {
            pathPartial(p);
          }
        }
        ctx.strokeStyle = rgba(cyan, alpha.litEdge * a);
        ctx.lineWidth = kind === 2 ? 1.6 : 1.4;
        ctx.stroke();
      }
      ctx.setLineDash(NO_DASH);
    };

    const drawRun = (r: Run, now: number, env: number, primary: boolean) => {
      const el = now - r.start;
      const a = env * scale;
      drawTrails(r, el, a);

      for (let i = 0; i < NN; i++) {
        lit[i] = 0;
        ring[i] = -1;
        thinking[i] = 0;
      }
      subOrbit = -1;
      sandboxLit = 0;
      for (let i = 0; i < r.acts.length; i++) {
        const act = r.acts[i];
        const since = el - act.at;
        if (since < 0) continue;
        lit[act.node] = Math.max(lit[act.node], Math.min(1, since / T_LIT_RAMP));
        if (since < T_PULSE) ring[act.node] = since / T_PULSE;
        if (act.think && since < T_THINK) thinking[act.node] = 1;
        if (act.node === SUB && since < T_SUB) subOrbit = since / T_SUB;
        if (isSlot(act.node) && since < T_TOOL + 200) {
          sandboxLit = Math.max(sandboxLit, Math.min(1, since / T_LIT_RAMP, (T_TOOL + 200 - since) / 200));
        }
      }

      for (let i = 0; i < NN; i++) {
        if (lit[i] <= 0) continue;
        const la = lit[i] * a;
        ctx.beginPath();
        if (i === MEM) ctx.roundRect(nx[i] - 6.5, ny[i] - 6.5, 13, 13, 3); // a store, not a step
        else ctx.arc(nx[i], ny[i], nodeR[i] + 0.8, 0, TAU);
        ctx.fillStyle = rgba(cyan, alpha.lit * la);
        ctx.fill();
        if (i === PLAN || i === REFLECT || i === ANSWER || i === SUB) {
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

      for (let i = 0; i < NN; i++) {
        if (ring[i] < 0) continue;
        const p = ring[i];
        ctx.beginPath();
        ctx.arc(nx[i], ny[i], nodeR[i] + 4 + 16 * easeOutCubic(p), 0, TAU);
        ctx.strokeStyle = rgba(cyan, 0.5 * (1 - p) * a);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // The sub-agent's own loop: three steps orbiting it while it works.
      if (subOrbit >= 0) {
        const fade = Math.min(1, subOrbit * 6, (1 - subOrbit) * 6);
        const R = nodeR[SUB] + 11;
        ctx.beginPath();
        ctx.arc(nx[SUB], ny[SUB], R, 0, TAU);
        ctx.strokeStyle = rgba(cyan, 0.22 * fade * a);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        for (let d = 0; d < 3; d++) {
          const ang = subOrbit * TAU * 1.6 + (d * TAU) / 3 - Math.PI / 2;
          const x = nx[SUB] + R * Math.cos(ang);
          const y = ny[SUB] + R * Math.sin(ang);
          ctx.moveTo(x + 2, y);
          ctx.arc(x, y, 2, 0, TAU);
        }
        ctx.fillStyle = rgba(cyan, 0.9 * fade * a);
        ctx.fill();
      }

      for (let i = 0; i < r.segs.length; i++) {
        const s = r.segs[i];
        if (el < s.at || el >= s.at + s.dur) continue;
        geom(s.a, s.b, s.ox, s.oy);
        const p = easeInOutCubic((el - s.at) / s.dur);
        const x = bez3(AX, C1X, C2X, BX, p);
        const y = bez3(AY, C1Y, C2Y, BY, p);
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

    /** Loading rings on slots that just swapped tools. */
    const drawSwaps = (now: number) => {
      for (let s = 0; s < N_SLOTS; s++) {
        const p = (now - slotSwapAt[s]) / T_SWAP;
        if (p < 0 || p >= 1) continue;
        const i = T0 + s;
        const fade = Math.min(1, p * 5, (1 - p) * 4);
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -p * 24;
        ctx.beginPath();
        ctx.arc(nx[i], ny[i], nodeR[i] + 7, 0, TAU);
        ctx.strokeStyle = rgba(cyan, 0.8 * fade * scale);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash(NO_DASH);
        ctx.lineDashOffset = 0;
      }
    };

    const drawLabels = (env: number, now: number, r: Run | null) => {
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      for (let i = 0; i < NN; i++) {
        const right = labRight[i] === 1;
        ctx.textAlign = right ? 'right' : 'left';
        const x = nx[i] + labDX[i];
        const y = ny[i] + labDY[i];
        const l = lit[i] * env;
        // Slot labels cross-fade when the slot loads a new tool.
        const s = i - T0;
        const sp = isSlot(i) ? (now - slotSwapAt[s]) / T_SWAP : 1;
        if (isSlot(i) && sp >= 0 && sp < 1 && slotPrev[s]) {
          const e = easeOutCubic(sp);
          ctx.fillStyle = rgba(muted, alpha.label * (1 - e));
          ctx.fillText(slotPrev[s], x, y - 7 * e);
          ctx.fillStyle = rgba(cyan, 0.95 * e);
          ctx.fillText(slotName[s], x, y + 7 * (1 - e));
          continue;
        }
        const text = nameOf(i);
        if (l < 1) {
          ctx.fillStyle = rgba(muted, alpha.label * (1 - l));
          ctx.fillText(text, x, y);
        }
        if (l > 0) {
          ctx.fillStyle = rgba(cyan, 0.95 * l);
          ctx.fillText(text, x, y);
        }
        if (thinking[i] && env > 0 && !right) {
          for (let d = 0; d < 3; d++) {
            const on = 0.35 + 0.65 * Math.max(0, Math.sin(now / 140 - d * 0.9));
            ctx.beginPath();
            ctx.arc(x + labW[i] + 7 + d * 5, y + 1, 1.3, 0, TAU);
            ctx.fillStyle = rgba(cyan, on * env);
            ctx.fill();
          }
        }
      }

      // Sandbox label, top-right inside the box; lights while a tool runs in it.
      ctx.textAlign = 'right';
      const sx = bx + SB.u1 * bw - 8;
      const sy = by + SB.v0 * bh + 11;
      ctx.fillStyle = rgba(muted, alpha.label * 0.8 * (1 - sandboxLit * env));
      ctx.fillText('sandbox', sx, sy);
      if (sandboxLit * env > 0) {
        ctx.fillStyle = rgba(cyan, 0.9 * sandboxLit * env);
        ctx.fillText('sandbox', sx, sy);
      }

      // Eval badge under-left of reflect.
      if (r) {
        const el = now - r.start;
        if (el >= r.evalAt) {
          const e = Math.min(1, (el - r.evalAt) / 250) * env;
          ctx.fillStyle = rgba(cyan, 0.9 * e);
          ctx.fillText('eval ✓', nx[REFLECT] - 14, ny[REFLECT] + 14);
        }
      }
      ctx.textAlign = 'left';
    };

    const drawLog = (r: Run, now: number, env: number) => {
      const el = now - r.start;
      const lx = bx;
      const ly = by + bh + LOG_GAP;
      const maxChars = Math.max(8, Math.floor((W - 24 - lx) / charW));
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      const span = Math.max(0, Math.min(el, r.end - T_HOLD));
      const secs = (span / 1000).toFixed(1);
      const tok = (180 + Math.floor(span * 0.42)).toLocaleString('en-US');
      ctx.fillStyle = rgba(muted, alpha.log * 0.6 * env);
      ctx.fillText(`trace · run ${String(r.id).padStart(3, '0')} · ${secs}s · ${tok} tok`, lx, ly);

      let count = 0;
      while (count < r.lines.length && r.lines[count].at <= el) count++;
      const first = Math.max(0, count - LOG_LINES);
      for (let i = first; i < count; i++) {
        const ln = r.lines[i];
        const y = ly + (i - first + 1) * LINE_H;
        const newest = i === count - 1;
        const chars = Math.min(ln.text.length, maxChars, Math.floor((el - ln.at) / TYPE_MS));
        ctx.fillStyle = newest ? rgba(cyan, alpha.logHot * env) : rgba(muted, alpha.log * env);
        ctx.fillText(ln.text.slice(0, chars), lx, y);
        if (newest && r.fadeAt === 0 && (chars < ln.text.length || Math.floor(now / 500) % 2 === 0)) {
          ctx.fillRect(lx + chars * charW + 2, y - 5, 5, 10);
        }
      }
    };

    const draw = (now: number) => {
      if (!reduced) {
        if (!run && now >= nextRunAt) run = buildRun(now, false, 0, 0);
        if (run && run.fadeAt === 0 && now - run.start >= run.end) run.fadeAt = now;
        if (run && run.fadeAt !== 0 && envOf(run, now) <= 0) {
          run = null;
          nextRunAt = now + T_IDLE;
        }
        if (ghost && envOf(ghost, now) <= 0) ghost = null;
      }
      // Apply tool loads that the primary run has reached.
      if (run) {
        const el = now - run.start;
        for (const s of run.swaps) {
          if (s.applied || el < s.at) continue;
          s.applied = true;
          slotPrev[s.slot] = slotName[s.slot];
          slotName[s.slot] = s.name;
          slotSwapAt[s.slot] = now - (el - s.at);
        }
      }

      for (let i = 0; i < NN; i++) {
        nx[i] = bx + nodeU[i] * bw + 2 * Math.sin(t * 0.7 + nodePh[i]);
        ny[i] = by + nodeV[i] * bh + 2 * Math.cos(t * 0.55 + nodePh[i] * 1.3);
      }
      for (let i = 0; i < N_DUST; i++) {
        px[i] = homeX[i] + ampX[i] * Math.sin(t * freqX[i] + phX[i]);
        py[i] = homeY[i] + ampY[i] * Math.sin(t * freqY[i] + phY[i]);
      }

      ctx.clearRect(0, 0, W, H);

      // Dust.
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

      // Primary run state first: lit / sandbox values feed the resting pass.
      let env = 0;
      if (run) env = envOf(run, now);

      // Sandbox box.
      ctx.setLineDash(SB_DASH);
      ctx.beginPath();
      ctx.roundRect(
        bx + SB.u0 * bw,
        by + SB.v0 * bh,
        (SB.u1 - SB.u0) * bw,
        (SB.v1 - SB.v0) * bh,
        10
      );
      ctx.strokeStyle = rgba(accent, alpha.harness * scale);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash(NO_DASH);

      // Resting edges: loop solid, re-plan dashed, memory dotted.
      ctx.beginPath();
      geom(Q, PLAN, 0, 0);
      pathFull();
      for (const n of [T0, T0 + 1, SUB]) {
        geom(PLAN, n, 0, 0);
        pathFull();
        geom(n, REFLECT, 0, 0);
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
      ctx.setLineDash(HARNESS_DASH);
      ctx.beginPath();
      geom(MEM, PLAN, 0, 0);
      pathFull();
      geom(ANSWER, MEM, 0, 0);
      pathFull();
      ctx.strokeStyle = rgba(accent, alpha.harness * scale);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash(NO_DASH);

      // Resting nodes. Model calls (plan/reflect/answer) and the sub-agent get
      // a ring; memory is drawn as a small rounded square (a store, not a step).
      ctx.beginPath();
      for (let i = 0; i < NN; i++) {
        if (i === MEM) continue;
        ctx.moveTo(nx[i] + nodeR[i], ny[i]);
        ctx.arc(nx[i], ny[i], nodeR[i], 0, TAU);
      }
      ctx.fillStyle = rgba(accent, alpha.node * scale);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(nx[MEM] - 6, ny[MEM] - 6, 12, 12, 3);
      ctx.fillStyle = rgba(accent, alpha.node * 0.5 * scale);
      ctx.fill();
      ctx.strokeStyle = rgba(accent, alpha.node * scale);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      for (const i of [PLAN, REFLECT, ANSWER, SUB]) {
        ctx.moveTo(nx[i] + nodeR[i] + 4, ny[i]);
        ctx.arc(nx[i], ny[i], nodeR[i] + 4, 0, TAU);
      }
      ctx.strokeStyle = rgba(accent, alpha.node * 0.6 * scale);
      ctx.stroke();

      if (ghost) drawRun(ghost, now, envOf(ghost, now), false);
      if (run) {
        drawRun(run, now, env, true);
        // Sandbox border lights while a tool runs inside it.
        if (sandboxLit > 0) {
          ctx.setLineDash(SB_DASH);
          ctx.beginPath();
          ctx.roundRect(bx + SB.u0 * bw, by + SB.v0 * bh, (SB.u1 - SB.u0) * bw, (SB.v1 - SB.v0) * bh, 10);
          ctx.strokeStyle = rgba(cyan, 0.55 * sandboxLit * env * scale);
          ctx.stroke();
          ctx.setLineDash(NO_DASH);
        }
      } else {
        lit.fill(0);
        thinking.fill(0);
        sandboxLit = 0;
      }
      drawSwaps(now);

      if (wide) {
        drawLabels(env, now, run);
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
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}

export default AgentHarnessField;
