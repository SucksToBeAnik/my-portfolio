import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MODE_COOKIE, MODE_PARAM, parseMode } from "@/lib/mode";

export default auth((req) => {
  const url = req.nextUrl;

  // Asking for an admin route while signed out lands on the login form rather
  // than the homepage: /admin is the address you'd type from memory, and it
  // should get you somewhere useful.
  if (!req.auth && url.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", url));
  }

  // The per-audience home pages are an implementation detail; anyone who
  // reaches one directly is sent to the shareable address instead.
  const direct = url.pathname.match(/^\/home\/([^/]+)$/);
  if (direct) {
    const mode = parseMode(direct[1]);
    return NextResponse.redirect(new URL(mode ? `/?${MODE_PARAM}=${mode}` : "/", url));
  }

  let res = NextResponse.next();
  const linkMode = parseMode(url.searchParams.get(MODE_PARAM));

  // `/` is served from a pre-rendered variant: the link's mode, else the one a
  // previous link left in a cookie, else the admin-chosen default.
  if (url.pathname === "/") {
    const mode = linkMode ?? parseMode(req.cookies.get(MODE_COOKIE)?.value) ?? "default";
    res = NextResponse.rewrite(new URL(`/home/${mode}`, url));
  }

  if (linkMode) {
    res.cookies.set(MODE_COOKIE, linkMode, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }

  if (!req.cookies.has("visitor_id")) {
    res.cookies.set("visitor_id", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
