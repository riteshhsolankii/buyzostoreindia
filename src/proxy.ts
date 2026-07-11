import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = await isValidSession(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  // Admin pages require a session; send anonymous visitors to the login page.
  if (pathname.startsWith("/admin") && !loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already logged in — skip the login page.
  if (pathname === "/login" && loggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Product reads are public; writes are admin-only.
  if (
    pathname.startsWith("/api/products") &&
    request.method !== "GET" &&
    !loggedIn
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/api/products", "/api/products/:path*"],
};
