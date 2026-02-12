import { NextResponse } from "next/server";

import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgInitSchema } from "@/lib/db/deals-repo";

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
    await pgInitSchema();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

