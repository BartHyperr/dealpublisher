import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  isAuthEnabled,
  verifyCredentials,
  getAuthSecret,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Login is niet geconfigureerd" },
      { status: 400 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json(
      { error: "Wachtwoord is verplicht" },
      { status: 400 }
    );
  }
  if (process.env.LOGIN_USERNAME?.trim() && !username.trim()) {
    return NextResponse.json(
      { error: "Gebruikersnaam is verplicht" },
      { status: 400 }
    );
  }

  if (!verifyCredentials(username, password)) {
    if (process.env.NODE_ENV === "development") {
      const u = process.env.LOGIN_USERNAME?.trim();
      console.warn(
        "[auth] Login mislukt: ontvangen username length=%s, password length=%s; env LOGIN_USERNAME length=%s",
        username.length,
        password.length,
        u?.length ?? 0
      );
    }
    return NextResponse.json(
      { error: "Onjuiste gebruikersnaam of wachtwoord" },
      { status: 401 }
    );
  }

  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Login niet geconfigureerd" },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dagen
    path: "/",
  });
  return res;
}
