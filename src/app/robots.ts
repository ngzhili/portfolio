/**
 * robots.txt — allows all crawlers and points to the sitemap.
 * Emitted as out/robots.txt by the static export.
 */
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@content/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
