import { NextResponse } from "next/server";

import { dealsDb } from "@/lib/deals/mock-db";
import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgGetDeals } from "@/lib/db/deals-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isPostgresEnabled()) {
    const deals = await pgGetDeals();
    return NextResponse.json({ deals });
  }

  return NextResponse.json({ deals: dealsDb.getAll() });
}

