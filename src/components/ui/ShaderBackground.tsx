'use client';

/**
 * ShaderBackground — animated aurora-streak shader for the hero background.
 *
 * A full-bleed WebGL plane (three.js) rendering drifting diagonal light
 * streaks. The canvas is transparent so the page background and active theme
 * show through:
 *   - dark theme: bright violet/cyan aurora on near-black (full intensity)
 *   - light theme: toned-down violet haze so it doesn't wash out on white
 *
 * Theme is read from the `light` class on <html> (set by ThemeToggle) and
 * watched live with a MutationObserver. Honors prefers-reduced-motion and
 * pauses when the tab is hidden to save GPU.
 *
 * Scroll fade-out is handled by the parent (Hero) via framer-motion opacity,
 * not here — this component only paints.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Per-theme tuning. Light streaks washing out on a white page get pulled down
// in intensity and nudged toward the violet accent so they read as a haze.
const THEME_SETTINGS = {
  dark: { intensity: 0.85 },
  light: { intensity: 0.4 },
} as const;

export function ShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Render at a fraction of CSS resolution and stretch the canvas back up.
    // The aurora is soft, so the downscale is invisible but cuts fragment-shader
    // work to ~RENDER_SCALE^2 — the single biggest win against scroll jank.
    const RENDER_SCALE = 0.65;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // antialias off — the low-res buffer is CSS-upscaled (already soft), so MSAA
    // is wasted fragment work.
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setClearColor(0x000000, 0); // transparent — let page bg show
    renderer.setPixelRatio(1); // never multiply by DPR — this is a soft bg
    const canvas = renderer.domElement;
    // CSS stretches the low-res buffer to fill the container.
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    renderer.setSize(
      Math.max(1, Math.round(container.clientWidth * RENDER_SCALE)),
      Math.max(1, Math.round(container.clientHeight * RENDER_SCALE)),
      false // don't write inline px size to the canvas style
    );
    container.appendChild(canvas);

    const isLight = () => document.documentElement.classList.contains('light');

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          // Buffer (scaled) pixels — matches gl_FragCoord so the pattern's
          // framing is identical regardless of RENDER_SCALE.
          value: new THREE.Vector2(
            container.clientWidth * RENDER_SCALE,
            container.clientHeight * RENDER_SCALE
          ),
        },
        uIntensity: {
          value: isLight()
            ? THEME_SETTINGS.light.intensity
            : THEME_SETTINGS.dark.intensity,
        },
      },
      vertexShader: /* glsl */ `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float iTime;
        uniform vec2 iResolution;
        uniform float uIntensity;

        #define NUM_OCTAVES 3

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u*u*(3.0-2.0*u);

          float res = mix(
            mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
            mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
          return res * res;
        }

        float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.3;
          vec2 shift = vec2(100);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.4;
          }
          return v;
        }

        void main() {
          vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
          vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
          vec2 v;
          vec4 o = vec4(0.0);

          float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

          for (float i = 0.0; i < 35.0; i++) {
            v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5 + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
            float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 35.0));
            vec4 auroraColors = vec4(
              0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
              0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
              0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3),
              1.0
            );
            vec4 currentContribution = auroraColors * exp(sin(i * i + iTime * 0.8)) / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
            float thinnessFactor = smoothstep(0.0, 1.0, i / 35.0) * 0.6;
            o += currentContribution * (1.0 + tailNoise * 0.8) * thinnessFactor;
          }

          o = tanh(pow(o / 100.0, vec4(1.6)));

          // Premultiplied-style alpha from luminance so the dark page peeks
          // through the gaps instead of an opaque black fill.
          vec3 col = o.rgb * 1.5 * uIntensity;
          float alpha = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Sync intensity uniform to the active theme.
    const applyTheme = () => {
      material.uniforms.uIntensity.value = isLight()
        ? THEME_SETTINGS.light.intensity
        : THEME_SETTINGS.dark.intensity;
    };
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Render loop, gated on BOTH tab visibility and on-screen state so the GPU
    // isn't pegged running a heavy fragment shader while you've scrolled past
    // the hero — that idle load is what starves the compositor and janks scroll.
    let frameId = 0;
    let onScreen = true;
    let scrolling = false;
    const animate = () => {
      material.uniforms.iTime.value += 0.016;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    const shouldRun = () =>
      !prefersReducedMotion && !document.hidden && onScreen && !scrolling;
    const start = () => {
      if (frameId === 0 && shouldRun()) animate();
    };
    const stop = () => {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera); // single static frame
    } else {
      start();
    }

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Freeze the shader while the page is actively scrolling: a live, full-bleed
    // transparent canvas re-composited every scroll frame is what causes the
    // jank. Frozen, it still fades via CSS opacity (compositor-only). Resume
    // shortly after scrolling settles.
    let scrollIdleTimer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      if (!scrolling) {
        scrolling = true;
        stop();
      }
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => {
        scrolling = false;
        start();
      }, 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Stop the loop once the hero scrolls out of view, resume when it returns.
    // rootMargin keeps it running slightly past the edges for a seamless resume.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (prefersReducedMotion) return;
        if (onScreen) start();
        else stop();
      },
      { rootMargin: '100px' }
    );
    intersectionObserver.observe(container);

    // Resize to container (not window) — it fills the hero via absolute inset.
    const handleResize = () => {
      const bw = Math.max(1, Math.round(container.clientWidth * RENDER_SCALE));
      const bh = Math.max(1, Math.round(container.clientHeight * RENDER_SCALE));
      renderer.setSize(bw, bh, false);
      material.uniforms.iResolution.value.set(bw, bh);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
      themeObserver.disconnect();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}

export default ShaderBackground;
