import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("query_remaining")?.value;
  let remaining = raw ? parseInt(raw, 10) : 50;
  if (Number.isNaN(remaining)) remaining = 50;

  if (remaining <= 0) {
    return Response.json({ remaining: 0 });
  }

  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const maxAge = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);

  const newRemaining = remaining - 1;
  const response = Response.json({ remaining: newRemaining });
  response.headers.set(
    "Set-Cookie",
    `query_remaining=${newRemaining}; Path=/; Max-Age=${maxAge}; SameSite=Lax`,
  );

  return response;
}
