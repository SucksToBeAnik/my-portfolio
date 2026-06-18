import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

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

  if (!req.auth && url.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", url));
  }

  return res;
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
