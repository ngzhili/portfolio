/**
 * GitHub star counts, fetched at BUILD TIME.
 *
 * This site is a static export (next.config.mjs → output: 'export'), so these
 * fetches run once on the build machine — visitors never hit the GitHub API and
 * there's no client-side rate limit or loading flicker. If a fetch fails (rate
 * limit, private/missing repo, offline build), we return null and the UI simply
 * omits the star badge.
 */

/** Pull `{ owner, name }` out of a github.com URL, or null if it isn't one. */
export function parseRepo(url: string): { owner: string; name: string } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { owner: m[1], name: m[2].replace(/\.git$/, '') };
}

/** Star count for a repo URL, or null if it can't be determined. */
export async function getStars(repoUrl: string): Promise<number | null> {
  const parsed = parseRepo(repoUrl);
  if (!parsed) return null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.name}`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

/** Stars for many repo URLs in parallel; non-github / empty entries → null. */
export function getStarsForRepos(repoUrls: string[]): Promise<(number | null)[]> {
  return Promise.all(repoUrls.map((u) => getStars(u)));
}
