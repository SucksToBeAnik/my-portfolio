import { getRecentGithubActivity } from "@/lib/github";

export async function GET() {
  const activities = await getRecentGithubActivity();
  return Response.json(
    { activities },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
