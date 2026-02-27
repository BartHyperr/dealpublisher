import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = isAuthEnabled();
  const usernameConfigured = Boolean(
    process.env.LOGIN_USERNAME != null && process.env.LOGIN_USERNAME.trim() !== ""
  );
  return NextResponse.json({
    enabled,
    usernameConfigured,
    hint: !enabled
      ? "Zet LOGIN_PASSWORD in .env.local en herstart de server (npm run dev)."
      : undefined,
  });
}
