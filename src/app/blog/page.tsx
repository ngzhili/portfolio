/**
 * Blog index — lists all posts (newest first) read from content/blog/*.mdx.
 * Add posts by dropping .mdx files there; they appear automatically.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Tag } from '@/components/ui/Tag';
import { getAllPosts, formatDate } from '@/lib/blog';
import { ArrowRightIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles and notes on web development, engineering, and what I’m learning.',
  openGraph: {
    title: 'Blog',
    description: 'Articles and notes on web development, engineering, and what I’m learning.',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <Container className="pb-20 pt-28 sm:pt-32">
      <Reveal>
        <header className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan">
            Writing
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">Blog</h1>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Thoughts on web development, engineering, and things I&apos;m learning.
          </p>
        </header>
      </Reveal>

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet. Add an .mdx file in content/blog/.</p>
      ) : (
        <ul className="space-y-5">
          {posts.map((post, i) => (
            <Reveal as="li" key={post.slug} delay={i * 0.05}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-border bg-surface/60 p-6 transition-all hover:-translate-y-0.5 hover:border-accent/50 sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime}</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-text transition-colors group-hover:text-cyan sm:text-2xl">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {post.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-text">
                    Read <ArrowRightIcon width={16} height={16} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </Container>
  );
}
