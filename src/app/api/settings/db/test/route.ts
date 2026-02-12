import { NextResponse } from "next/server";

import { getPgPool, isPostgresEnabled } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isPostgresEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Postgres is niet ingeschakeld. Zet DATA_SOURCE=postgres en DATABASE_URL in .env.local",
      },
      { status: 400 }
    );
  }

  try {
    const pool = getPgPool();
    const res = await pool.query("select now() as now");
    return NextResponse.json({ ok: true, now: res.rows?.[0]?.now ?? null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

