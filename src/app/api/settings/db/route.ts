import { NextResponse } from "next/server";

import { isPostgresEnabled, maskDatabaseUrl } from "@/lib/db/postgres";
import { getPgPool } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const enabled = isPostgresEnabled();
  const configured = Boolean(url);

  let canConnect = false;
  let serverVersion: string | null = null;
  let error: string | null = null;

  if (enabled) {
    try {
      const pool = getPgPool();
      const res = await pool.query("select version() as v");
      canConnect = true;
      serverVersion = res.rows?.[0]?.v ?? null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  }

  return NextResponse.json({
    configured,
    enabled,
    databaseUrlMasked: configured ? maskDatabaseUrl(url) : null,
    canConnect,
    serverVersion,
    error,
  });
}

