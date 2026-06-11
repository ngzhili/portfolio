/**
 * Next.js configuration — STATIC EXPORT for GitHub Pages.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  EDIT HERE FOR YOUR REPO                                                │
 * │                                                                        │
 * │  If you deploy to a PROJECT repo (https://<user>.github.io/<repo>),    │
 * │  set `repoName` below to "/<your-repo-name>" (must start with "/").    │
 * │                                                                        │
 * │  If you deploy to a USER/ORG repo (https://<user>.github.io, i.e. the  │
 * │  repo is literally named "<user>.github.io"), set `repoName = ""`.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const repoName = '/portfolio'; // <-- CHANGE THIS to "/<your-repo-name>" (or "" for a user/org site)

// In production we prefix all routes/assets with the repo name so they resolve
// under the GitHub Pages subpath. In dev we keep the root so localhost works.
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? repoName : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a fully static site into ./out (no Node server required).
  output: 'export',

  // Serve under the GitHub Pages subpath in production.
  basePath,
  assetPrefix: basePath || undefined,

  // The Image Optimization API needs a server, which static export lacks.
  images: { unoptimized: true },

  // Emit /about/index.html instead of /about.html — friendlier on Pages.
  trailingSlash: true,

  // Expose the basePath to client components (e.g. for <img src> on /public assets).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
