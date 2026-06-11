/**
 * Blog data layer — reads MDX files from content/blog at BUILD TIME.
 *
 * This runs only on the server during `next build` (static export), so using
 * the Node filesystem here is safe and produces fully static pages.
 *
 * To add a post: drop a new `.mdx` file in content/blog/ with the frontmatter
 * shown in the sample posts (title, date, excerpt, tags). The filename (minus
 * `.mdx`) becomes the URL slug: content/blog/my-post.mdx → /blog/my-post.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export type PostFrontmatter = {
  title: string;
  date: string; // ISO date, e.g. "2025-01-15"
  excerpt: string;
  tags?: string[];
  author?: string;
};

export type PostMeta = PostFrontmatter & {
  slug: string;
  readingTime: string;
};

export type Post = PostMeta & {
  content: string; // raw MDX body
};

/** Rough reading-time estimate (~200 words/min). */
function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

/** List all post slugs (filenames without extension). */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((f) => f.replace(/\.mdx?$/, ''));
}

/** Read + parse a single post by slug. Returns null if it doesn't exist. */
export function getPostBySlug(slug: string): Post | null {
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;

  return {
    slug,
    title: fm.title ?? slug,
    date: fm.date ?? '',
    excerpt: fm.excerpt ?? '',
    tags: fm.tags ?? [],
    author: fm.author,
    readingTime: readingTime(content),
    content,
  };
}

/** All posts, newest first. */
export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content: _content, ...meta }) => meta);
}

/** Format an ISO date for display, e.g. "January 15, 2025". */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
