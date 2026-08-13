const GITHUB_USERNAME = "SucksToBeAnik";

interface GithubEvent {
  type: string;
  repo: { name: string };
  payload: Record<string, unknown>;
}

export interface GithubActivity {
  label: string;
}

function displayRepo(fullName: string): string {
  const [owner, name] = fullName.split("/");
  return owner?.toLowerCase() === GITHUB_USERNAME.toLowerCase() ? (name ?? fullName) : fullName;
}

function eventArray(payload: Record<string, unknown>, key: string): unknown[] {
  const value = payload[key];
  return Array.isArray(value) ? value : [];
}

function describeEvent(event: GithubEvent): GithubActivity | null {
  const repo = displayRepo(event.repo.name);

  switch (event.type) {
    case "PushEvent": {
      const count = eventArray(event.payload, "commits").length || 1;
      return { label: `Pushed ${count} commit${count === 1 ? "" : "s"} to ${repo}` };
    }
    case "PullRequestEvent":
      return {
        label: `${event.payload.action === "closed" ? "Merged" : "Opened"} a pull request in ${repo}`,
      };
    case "IssuesEvent":
      return { label: `Opened an issue in ${repo}` };
    case "CreateEvent":
      return event.payload.ref_type === "repository" ? { label: `Created ${repo}` } : null;
    case "WatchEvent":
      return { label: `Starred ${repo}` };
    case "ForkEvent":
      return { label: `Forked ${repo}` };
    case "ReleaseEvent":
      return { label: `Published a release in ${repo}` };
    default:
      return null;
  }
}

export async function getRecentGithubActivity(limit = 5): Promise<GithubActivity[]> {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    const events = (await response.json()) as GithubEvent[];
    const activities: GithubActivity[] = [];
    const seen = new Set<string>();
    for (const event of events) {
      const activity = describeEvent(event);
      if (activity && !seen.has(activity.label)) {
        seen.add(activity.label);
        activities.push(activity);
      }
      if (activities.length === limit) break;
    }
    return activities;
  } catch {
    return [];
  }
}
