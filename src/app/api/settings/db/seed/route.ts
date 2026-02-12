import { NextResponse } from "next/server";

import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgInitSchema } from "@/lib/db/deals-repo";
import { createSeedDeals } from "@/lib/deals/seed";
import { getPgPool } from "@/lib/db/postgres";

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
    const pool = getPgPool();
    const deals = createSeedDeals();

    for (const d of deals) {
      await pool.query(
        `
        insert into deals (
          id, title, url, image_url, category, post_text, generate, publish,
          post_date, promotion_days, promotion_end_date, days_remaining, status,
          created_at, updated_at
        ) values (
          $1,$2,$3,$4,$5::text[],$6,$7,$8,
          $9::timestamptz,$10,$11::date,$12,$13,
          $14::timestamptz,$15::timestamptz
        )
        on conflict (id) do update set
          title = excluded.title,
          url = excluded.url,
          image_url = excluded.image_url,
          category = excluded.category,
          post_text = excluded.post_text,
          generate = excluded.generate,
          publish = excluded.publish,
          post_date = excluded.post_date,
          promotion_days = excluded.promotion_days,
          promotion_end_date = excluded.promotion_end_date,
          days_remaining = excluded.days_remaining,
          status = excluded.status,
          updated_at = excluded.updated_at
        `,
        [
          d.id,
          d.title,
          d.url,
          d.imageUrl,
          d.category,
          d.postText,
          d.generate,
          d.publish,
          d.postDate ?? null,
          d.promotionDays,
          d.promotionEndDate ?? null,
          d.daysRemaining ?? null,
          d.status,
          d.createdAt,
          d.updatedAt,
        ]
      );
    }

    return NextResponse.json({ ok: true, count: deals.length });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

