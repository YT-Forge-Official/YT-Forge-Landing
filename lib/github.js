import { REPO } from './site';

const API = `https://api.github.com/repos/${REPO}`;

// One hour. Long enough that the landing page can never rate-limit itself
// (60 unauthenticated calls/hour), short enough that the numbers feel live.
const REVALIDATE = 3600;

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
    next: { revalidate: REVALIDATE },
  });
  return res.ok ? res.json() : null;
}

/**
 * Repo counters for the landing page: stars, forks, issues, and the total
 * asset downloads across every release.
 *
 * Both calls are cached for an hour and happen at render time on the server,
 * so this is one round trip per hour for the whole site — not one per visitor
 * — and a slow or angry GitHub degrades to nulls instead of blocking a render.
 */
export async function getRepoStats() {
  try {
    const [repo, releases] = await Promise.all([get(''), get('/releases?per_page=100')]);

    return {
      stars: repo?.stargazers_count ?? null,
      forks: repo?.forks_count ?? null,
      issues: repo?.open_issues_count ?? null,
      pushedAt: repo?.pushed_at ?? null,
      downloads: sumDownloads(releases),
    };
  } catch {
    return null;
  }
}

/**
 * Every asset download across every release. GitHub does not count the
 * auto-generated source archives, so this is real installer pulls.
 *
 * Note the per_page=100 above: past 100 releases this would need paging.
 */
function sumDownloads(releases) {
  if (!Array.isArray(releases)) return null;

  return releases.reduce(
    (total, release) =>
      total +
      (release.assets ?? []).reduce((sum, asset) => sum + (asset.download_count ?? 0), 0),
    0,
  );
}

export function formatCount(n) {
  if (n === null || n === undefined) return null;
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
}
