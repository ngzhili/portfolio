/**
 * Contact — NO backend. A prominent mailto CTA plus social/professional links.
 * Content from content/site.ts.
 */
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { socials } from '@content/site';
import {
  MailIcon,
  GitHubIcon,
  LinkedInIcon,
  GlobeIcon,
  ArrowRightIcon,
} from '@/components/ui/icons';

const channels = [
  {
    href: socials.github,
    label: 'GitHub',
    handle: 'github.com/ngzhili',
    Icon: GitHubIcon,
    external: true,
  },
  {
    href: socials.linkedin,
    label: 'LinkedIn',
    handle: 'in/ngzhili',
    Icon: LinkedInIcon,
    external: true,
  },
  // {
  //   href: socials.website,
  //   label: 'Website',
  //   handle: 'ng-zhili.web.app',
  //   Icon: GlobeIcon,
  //   external: true,
  // },
];

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Let's work together">
      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-surface-2 p-7 sm:p-10 lg:p-12">
          <div className="max-w-2xl">
            <p className="text-lg text-muted sm:text-xl">
              Have a project, role, or idea in mind? I&apos;d love to hear about it.
              The fastest way to reach me is email — I usually reply within a day.
            </p>

            <div className="mt-7">
              <Button href={`mailto:${socials.email}`} size="lg">
                <MailIcon width={18} height={18} />
                {socials.email}
                <ArrowRightIcon />
              </Button>
            </div>
          </div>

          {/* Other channels */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {channels.map(({ href, label, handle, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-bg/40 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50"
              >
                <span className="rounded-lg bg-surface-2 p-2 text-muted transition-colors group-hover:text-text">
                  <Icon />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text">{label}</span>
                  <span className="block truncate text-xs text-faint">{handle}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
