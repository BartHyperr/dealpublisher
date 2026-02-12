import type { Deal, DealStatus } from "@/types/deal";
import { getPgPool } from "@/lib/db/postgres";

function rowToDeal(row: any): Deal {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    imageUrl: row.image_url,
    category: row.category ?? [],
    postText: row.post_text ?? "",
    generate: row.generate,
    publish: row.publish,
    postDate: row.post_date ?? undefined,
    promotionDays: row.promotion_days,
    promotionEndDate: row.promotion_end_date ?? undefined,
    daysRemaining: row.days_remaining ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function pgInitSchema() {
  const pool = getPgPool();
  await pool.query(`
    create table if not exists deals (
      id text primary key,
      title text not null,
      url text not null,
      image_url text not null,
      category text[] not null default '{}',
      post_text text not null default '',
      generate text not null check (generate in ('Yes','No')),
      publish boolean not null default false,
      post_date timestamptz null,
      promotion_days int not null check (promotion_days in (5,7,14,21,30)),
      promotion_end_date date null,
      days_remaining int null,
      status text not null check (status in ('DRAFT','SCHEDULED','PUBLISHED','ENDED')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists deals_status_idx on deals (status);
    create index if not exists deals_post_date_idx on deals (post_date);
  `);
}

export async function pgGetDeals(): Promise<Deal[]> {
  const pool = getPgPool();
  const res = await pool.query(`select * from deals order by updated_at desc`);
  return res.rows.map(rowToDeal);
}

export async function pgPatchDeal(id: string, patch: Partial<Deal>): Promise<Deal | null> {
  const pool = getPgPool();

  // Minimal safe patch: alleen velden die we gebruiken in UI flows.
  const fields: Array<{ col: string; key: keyof Deal; cast?: string }> = [
    { col: "title", key: "title" },
    { col: "url", key: "url" },
    { col: "image_url", key: "imageUrl" },
    { col: "category", key: "category", cast: "::text[]" },
    { col: "post_text", key: "postText" },
    { col: "generate", key: "generate" },
    { col: "publish", key: "publish" },
    { col: "post_date", key: "postDate", cast: "::timestamptz" },
    { col: "promotion_days", key: "promotionDays" },
    { col: "promotion_end_date", key: "promotionEndDate", cast: "::date" },
    { col: "days_remaining", key: "daysRemaining" },
    { col: "status", key: "status" },
  ];

  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const f of fields) {
    if (patch[f.key] === undefined) continue;
    updates.push(
      `${f.col} = $${i}${f.cast ?? ""}`
    );
    values.push(patch[f.key]);
    i++;
  }

  if (!updates.length) {
    const existing = await pool.query(`select * from deals where id = $1`, [id]);
    return existing.rowCount ? rowToDeal(existing.rows[0]) : null;
  }

  updates.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `update deals set ${updates.join(", ")} where id = $${values.length} returning *`,
    values
  );
  return res.rowCount ? rowToDeal(res.rows[0]) : null;
}

export async function pgPublishNow(id: string): Promise<Deal | null> {
  const pool = getPgPool();
  const res = await pool.query(
    `update deals
     set publish = true,
         status = $2::text,
         post_date = now(),
         updated_at = now()
     where id = $1
     returning *`,
    [id, "PUBLISHED" satisfies DealStatus]
  );
  return res.rowCount ? rowToDeal(res.rows[0]) : null;
}

