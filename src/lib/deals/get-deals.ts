import type { Deal } from "@/types/deal";
import { dealsDb } from "@/lib/deals/mock-db";
import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgGetDeals } from "@/lib/db/deals-repo";

/** Server-only: returns all deals from current datasource (Postgres or mock). */
export async function getDealsForNotification(): Promise<Deal[]> {
  if (isPostgresEnabled()) {
    return pgGetDeals();
  }
  return dealsDb.getAll();
}
