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
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'publications', label: 'Publications' },
  { id: 'skills', label: 'Skills' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
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
