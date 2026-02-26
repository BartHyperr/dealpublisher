import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "hyperr_auth";
const LOGIN_PATH = "/login";
const AUTH_API = "/api/auth";

function isAuthEnabled(): boolean {
  return Boolean(
    process.env.LOGIN_PASSWORD != null && process.env.LOGIN_PASSWORD.trim() !== ""
  );
}

function isAuthenticated(request: NextRequest): boolean {
  const secret = process.env.LOGIN_SECRET ?? process.env.LOGIN_PASSWORD ?? "";
  if (!secret) return false;
  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return cookie === secret;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthEnabled()) {
    if (pathname === LOGIN_PATH) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH || pathname.startsWith(`${AUTH_API}/`)) {
    return NextResponse.next();
  }

  if (!isAuthenticated(request)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
