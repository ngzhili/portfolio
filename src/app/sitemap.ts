/**
 * Static sitemap — generated at build time. Lists the home page and every
 * blog post so search engines can discover them.
 *
 * Note: with `output: 'export'` + `trailingSlash: true`, Next emits this as
 * out/sitemap.xml. URLs use SITE_URL from content/site.ts.
 */
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@content/site';
import { getAllPosts } from '@/lib/blog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/blog/`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}/`,
    lastModified: post.date || undefined,
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
