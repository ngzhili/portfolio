/**
 * JSON-LD structured data (schema.org) — Person + WebSite, linked via @graph.
 *
 * Helps search engines understand who the site is about and surface rich
 * results / knowledge-panel data. Rendered as a <script> in the static HTML
 * (server component), so crawlers see it without executing JavaScript.
 *
 * All values come from content/site.ts — edit there, not here.
 */
import { site, socials, SITE_URL } from '@content/site';

export function JsonLd() {
  const personId = `${SITE_URL}/#person`;

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: site.name,
        jobTitle: site.role,
        description: site.tagline,
        url: SITE_URL,
        image: site.ogImage,
        email: socials.email,
        homeLocation: { '@type': 'Place', name: site.location },
        sameAs: [socials.github, socials.linkedin],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: site.name,
        url: SITE_URL,
        inLanguage: 'en',
        author: { '@id': personId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
