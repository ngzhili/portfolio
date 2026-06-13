/**
 * Footer — social links + copyright. Content from content/site.ts.
 */
import Link from 'next/link';
import { site, socials } from '@content/site';
import { GitHubIcon, LinkedInIcon, GlobeIcon, MailIcon } from '@/components/ui/icons';

const links = [
  { href: `mailto:${socials.email}`, label: 'Email', Icon: MailIcon },
  { href: socials.github, label: 'GitHub', Icon: GitHubIcon },
  { href: socials.linkedin, label: 'LinkedIn', Icon: LinkedInIcon },
  { href: socials.website, label: 'Website', Icon: GlobeIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-faint">
          © {site.name}. Built with Next.js &amp; Tailwind.
        </p>

        <div className="flex items-center gap-2">
          {links.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Icon />
            </a>
          ))}
        </div>

        <Link
          href="/blog"
          className="hidden text-sm text-muted transition-colors hover:text-text"
        >
          Read the blog →
        </Link>
      </div>
    </footer>
  );
}
