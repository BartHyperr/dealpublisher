import { NextResponse } from "next/server";

import { dealsDb } from "@/lib/deals/mock-db";
import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgPublishNow } from "@/lib/db/deals-repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { dealId?: string };
  if (!body.dealId) {
    return NextResponse.json({ error: "Missing dealId" }, { status: 400 });
  }

  const deal = isPostgresEnabled()
    ? await pgPublishNow(body.dealId)
    : dealsDb.publishNow(body.dealId);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deal });
}

