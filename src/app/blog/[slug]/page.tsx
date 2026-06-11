/**
 * Blog post page — statically generated per slug at build time.
 * Renders MDX from content/blog/<slug>.mdx via next-mdx-remote (RSC),
 * which is fully compatible with `output: 'export'`.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Container } from '@/components/layout/Container';
import { Tag } from '@/components/ui/Tag';
import { getAllPosts, getPostBySlug, getPostSlugs, formatDate } from '@/lib/blog';
import { ArrowRightIcon } from '@/components/ui/icons';

type Params = { slug: string };

// Tell Next which slugs to pre-render (required for static export).
export function generateStaticParams(): Params[] {
  return getPostSlugs().map((slug) => ({ slug }));
}

// Per-post SEO metadata (title, description, Open Graph).
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date || undefined,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Simple "next post" suggestion (the one published before this).
  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === slug);
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <Container className="pb-20 pt-28 sm:pt-32">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowRightIcon className="rotate-180" width={16} height={16} /> Back to blog
      </Link>

      <article className="mt-8">
        <header className="mb-8 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-faint">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingTime}</span>
            {post.author && (
              <>
                <span aria-hidden>·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </header>

        {/* Rendered MDX body */}
        <div className="prose-portfolio">
          <MDXRemote source={post.content} />
        </div>
      </article>

      {next && (
        <div className="mt-14 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-widest text-faint">Next up</p>
          <Link
            href={`/blog/${next.slug}`}
            className="group mt-2 inline-flex items-center gap-2 text-xl font-semibold text-text transition-colors hover:text-cyan"
          >
            {next.title}
            <ArrowRightIcon />
          </Link>
        </div>
      )}
    </Container>
  );
}
