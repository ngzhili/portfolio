/**
 * Navigation model shared by the navbar (desktop + mobile) and footer.
 *
 * `sections` are in-page anchors on the home page (smooth-scroll).
 * To rename or reorder nav items, edit this list — IDs must match the
 * `id="..."` on each <Section> in the page.
 */

export type NavSection = {
  id: string; // anchor target on "/"
  label: string;
};

export const sections: NavSection[] = [
  { id: 'home', label: 'Home' },
  { id: 'agent-systems', label: 'Agents' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  // Publications, Certifications and Awards are still on the page (reached by
  // scrolling); they're left out here to keep the bar short.
];

/**
 * Build an href for an in-page section.
 *
 * On the home page we use a plain "#id" hash so the browser smooth-scrolls.
 * On other routes (e.g. /blog) we send the user back to "/#id".
 */
export function sectionHref(id: string, onHome: boolean): string {
  return onHome ? `#${id}` : `/#${id}`;
}
