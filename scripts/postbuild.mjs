/**
 * Post-build step: copy `.nojekyll` into the exported `out/` directory.
 *
 * GitHub Pages runs Jekyll by default, which IGNORES folders starting with an
 * underscore — including Next.js's `_next/` asset folder. The `.nojekyll` file
 * disables Jekyll so those assets are served. Without this, the site loads with
 * no CSS/JS on Pages.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'out');
const src = join(process.cwd(), '.nojekyll');
const dest = join(outDir, '.nojekyll');

if (!existsSync(outDir)) {
  console.warn('[postbuild] out/ not found — did `next build` run? Skipping .nojekyll copy.');
  process.exit(0);
}

if (existsSync(src)) {
  copyFileSync(src, dest);
} else {
  writeFileSync(dest, '');
}

console.log('[postbuild] Wrote out/.nojekyll');
