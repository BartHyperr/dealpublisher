import { NextResponse } from "next/server";

import type { DealStatus } from "@/types/deal";
import { dealsDb } from "@/lib/deals/mock-db";
import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgGetDealStats } from "@/lib/db/deals-repo";

export const dynamic = "force-dynamic";

type DealStatsResponse = {
  source: "postgres" | "mock";
  total: number;
  actief: number;
  concept: number;
  ingepland: number;
  gepubliceerd: number;
  beeindigd: number;
};

function computeStatsMock(): DealStatsResponse {
  const deals = dealsDb.getAll();
  const countStatus = (s: DealStatus) => deals.filter((d) => d.status === s).length;
  const concept = countStatus("DRAFT");
  const ingepland = countStatus("SCHEDULED");
  const gepubliceerd = countStatus("PUBLISHED");
  const beeindigd = countStatus("ENDED");
  const actief = ingepland + gepubliceerd;

  return {
    source: "mock",
    total: deals.length,
    actief,
    concept,
    ingepland,
    gepubliceerd,
    beeindigd,
  };
}

export async function GET() {
  if (isPostgresEnabled()) {
    const s = await pgGetDealStats();
    return NextResponse.json({
      source: "postgres",
      ...s,
    } satisfies DealStatsResponse);
  }

  return NextResponse.json(computeStatsMock());
}

