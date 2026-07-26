import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const url = req.nextUrl;
  const res = NextResponse.next();

  if (!req.cookies.has("visitor_id")) {
    const visitorId = crypto.randomUUID();
    res.cookies.set("visitor_id", visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  // Asking for an admin route while signed out lands on the login form rather
  // than the homepage: /admin is the address you'd type from memory, and it
  // should get you somewhere useful.
  if (!req.auth && url.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", url));
  }

  return res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
