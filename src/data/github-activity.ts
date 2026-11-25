export const githubAccount = 'hashbrown';
const projectRepositories = [
  'hashbrown/raindrop-rss',
  'hashbrown/alloneofme_site',
  'hashbrown/persist-mn',
];
export const activityDays = 10;
const activityLimit = 50;
const eventsPerPage = 100;
const maxEventPages = 3;
const dayMs = 24 * 60 * 60 * 1000;

interface Activity {
  title: string;
  repo: string;
  href: string;
  date: string;
  kind: string;
}

interface GitHubEvent {
  type: string;
  public: boolean;
  repo: { name: string };
  created_at: string;
  payload: {
    action?: string;
    ref?: string;
    head?: string;
    number?: number;
    pull_request?: { number?: number; title?: string; merged?: boolean };
    issue?: { number?: number; title?: string };
    release?: { name?: string; tag_name?: string };
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    committer?: { date?: string } | null;
  };
}

async function githubList<T>(path: string): Promise<T[] | null> {
  const options = {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'alloneofme-site',
      'X-GitHub-Api-Version': '2026-03-10',
    },
    signal: AbortSignal.timeout(4000),
    cf: { cacheEverything: true, cacheTtlByStatus: { '200': 900, '300-599': -1 } },
  };
  try {
    const response = await fetch(`https://api.github.com${path}`, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected a GitHub list');
    return data;
  } catch (error) {
    console.error('GitHub activity request failed', { path, error: String(error) });
    return null;
  }
}

function fromEvent(event: GitHubEvent): Activity | null {
  const repo = event.repo?.name;
  const date = event.created_at;
  if (!event.public || !/^[\w.-]+\/[\w.-]+$/.test(repo) || !Number.isFinite(Date.parse(date))) {
    return null;
  }
  const base = `https://github.com/${repo}`;
  const payload = event.payload ?? {};
  const meta = { repo, date };

  switch (event.type) {
    case 'PushEvent': {
      const branch = payload.ref?.replace(/^refs\/heads\//, '');
      const href = payload.head && /^[a-f0-9]{40}$/i.test(payload.head)
        ? `${base}/commit/${payload.head}`
        : base;
      return { ...meta, kind: 'Push', title: branch ? `Pushed to ${branch}` : 'Pushed changes', href };
    }
    case 'PullRequestEvent': {
      const pr = payload.pull_request;
      const number = pr?.number ?? payload.number;
      const kind = payload.action === 'opened' ? 'Opened PR'
        : payload.action === 'closed' && pr?.merged ? 'Merged PR' : null;
      if (!kind || !number) return null;
      return { ...meta, kind, title: pr?.title || `Pull request #${number}`, href: `${base}/pull/${number}` };
    }
    case 'IssuesEvent': {
      const issue = payload.issue;
      if (payload.action !== 'opened' || !issue?.number) return null;
      return { ...meta, kind: 'Opened issue', title: issue.title || `Issue #${issue.number}`, href: `${base}/issues/${issue.number}` };
    }
    case 'ReleaseEvent': {
      const release = payload.release;
      if (payload.action !== 'published' || !release?.tag_name) return null;
      return { ...meta, kind: 'Release', title: release.name || release.tag_name, href: `${base}/releases/tag/${encodeURIComponent(release.tag_name)}` };
    }
    case 'WatchEvent':
      return { ...meta, kind: 'Star', title: `Starred ${repo}`, href: base };
    default:
      return null;
  }
}

async function projectCommits(repo: string, cutoff: number) {
  // Round down for a stable daily cache key, then enforce the exact cutoff below.
  const since = new Date(Math.floor(cutoff / dayMs) * dayMs).toISOString();
  const query = new URLSearchParams({ per_page: String(activityLimit), since });
  const commits = await githubList<GitHubCommit>(`/repos/${repo}/commits?${query}`);
  return commits?.flatMap(({ sha, commit }) => {
    const date = commit?.committer?.date;
    const title = commit?.message?.split('\n', 1)[0]?.trim();
    if (!date || !(Date.parse(date) >= cutoff) || !title || !/^[a-f0-9]{40}$/i.test(sha)) return [];
    return [{ kind: 'Project commit', title, repo, date, href: `https://github.com/${repo}/commit/${sha}` }];
  }) ?? null;
}

export async function loadGitHubActivity() {
  const cutoff = Date.now() - activityDays * dayMs;
  const activity = new Map<string, Activity>();
  let available = false;

  for (let page = 1; page <= maxEventPages && activity.size < activityLimit; page++) {
    const events = await githubList<GitHubEvent>(
      `/users/${githubAccount}/events/public?per_page=${eventsPerPage}&page=${page}`,
    );
    if (!events) break;
    available = true;
    for (const event of events) {
      const item = fromEvent(event);
      if (item && Date.parse(item.date) >= cutoff && !activity.has(item.href)) {
        activity.set(item.href, item);
      }
    }
    const oldest = events.at(-1);
    if (events.length < eventsPerPage || (oldest && Date.parse(oldest.created_at) < cutoff)) break;
  }

  if (activity.size < activityLimit) {
    const commits = await Promise.all(projectRepositories.map((repo) => projectCommits(repo, cutoff)));
    available ||= commits.some((items) => items !== null);
    for (const item of commits.flatMap((items) => items ?? [])) activity.set(item.href, item);
  }

  return {
    available,
    items: [...activity.values()]
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, activityLimit),
  };
}
