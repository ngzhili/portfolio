/**
 * Prefix a /public asset path with the configured basePath.
 *
 * Next.js auto-prefixes basePath for <Link> and <Image src>, but NOT for plain
 * <a href> pointing at static files (e.g. the resume PDF). Use this helper for
 * those so the link works under the GitHub Pages subpath.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBasePath(path: string): string {
  if (/^https?:\/\//.test(path)) return path; // already absolute URL
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}
