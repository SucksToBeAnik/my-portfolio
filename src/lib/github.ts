const GITHUB_USERNAME = "SucksToBeAnik";

interface GithubEvent {
  type: string;
  repo: { name: string };
  payload: Record<string, any>;
}

export interface GithubActivity {
  label: string;
  url: string;
}

function displayRepo(fullName: string): string {
  const [owner, name] = fullName.split("/");
  return owner?.toLowerCase() === GITHUB_USERNAME.toLowerCase() ? name : fullName;
}

function describeEvent(event: GithubEvent): GithubActivity | null {
  const repo = displayRepo(event.repo.name);
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case "PushEvent": {
      const count = event.payload.commits?.length ?? 1;
      return {
        label: `pushed ${count} commit${count === 1 ? "" : "s"} to ${repo}`,
        url: repoUrl,
      };
    }
    case "PullRequestEvent": {
      const action = event.payload.action === "closed" ? "merged" : "opened";
      return { label: `${action} a pull request in ${repo}`, url: event.payload.pull_request?.html_url ?? repoUrl };
    }
    case "IssuesEvent":
      return { label: `opened an issue in ${repo}`, url: event.payload.issue?.html_url ?? repoUrl };
    case "CreateEvent":
      if (event.payload.ref_type === "repository") {
        return { label: `created ${repo}`, url: repoUrl };
      }
      return null;
    case "WatchEvent":
      return { label: `starred ${repo}`, url: repoUrl };
    case "ForkEvent":
      return { label: `forked ${repo}`, url: repoUrl };
    case "ReleaseEvent":
      return { label: `published a release in ${repo}`, url: event.payload.release?.html_url ?? repoUrl };
    default:
      return null;
  }
}

export async function getRecentGithubActivity(limit = 5): Promise<GithubActivity[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const events: GithubEvent[] = await res.json();
    const activities: GithubActivity[] = [];
    const seenLabels = new Set<string>();
    for (const event of events) {
      const activity = describeEvent(event);
      if (activity && !seenLabels.has(activity.label)) {
        seenLabels.add(activity.label);
        activities.push(activity);
      }
      if (activities.length >= limit) break;
    }
    return activities;
  } catch {
    return [];
  }
}
