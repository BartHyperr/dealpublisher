import { NextResponse } from "next/server";

import { dealsDb } from "@/lib/deals/mock-db";
import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgPatchDeal } from "@/lib/db/deals-repo";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const patch = (await req.json()) as Record<string, unknown>;
  const updated = isPostgresEnabled()
    ? await pgPatchDeal(params.id, patch as never)
    : dealsDb.patchById(params.id, patch as never);
  if (!updated) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  return NextResponse.json({ deal: updated });
}

