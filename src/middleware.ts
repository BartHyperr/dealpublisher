import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "hyperr_auth";
const LOGIN_PATH = "/login";
const AUTH_API = "/api/auth";

function normalizeEnv(value: string | undefined): string {
  if (value == null) return "";
  const s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

function isAuthEnabled(): boolean {
  return normalizeEnv(process.env.LOGIN_PASSWORD) !== "";
}

function isAuthenticated(request: NextRequest): boolean {
  const secret =
    normalizeEnv(process.env.LOGIN_SECRET) || normalizeEnv(process.env.LOGIN_PASSWORD);
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
