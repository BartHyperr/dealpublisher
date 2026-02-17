import type { Deal, DealStatus } from "@/types/deal";
import { getPgPool } from "@/lib/db/postgres";

type DealRow = {
  id: string;
  title: string;
  url: string;
  image_url: string;
  category: string[] | null;
  post_text: string | null;
  generate: "Yes" | "No";
  publish: boolean;
  post_date: string | null;
  promotion_days: Deal["promotionDays"];
  promotion_end_date: string | null;
  days_remaining: number | null;
  status: DealStatus;
  created_at: string;
  updated_at: string;
};

function rowToDeal(row: DealRow): Deal {
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
  return res.rows.map((r) => rowToDeal(r as DealRow));
}

type CreateDealPayload = {
  title: string;
  url: string;
  imageUrl: string;
  category: string[];
  postText: string;
  promotionDays: Deal["promotionDays"];
  publish: boolean;
  postDate?: string;
  status: DealStatus;
  generate: "Yes" | "No";
};

export async function pgCreateDeal(payload: CreateDealPayload): Promise<Deal> {
  const pool = getPgPool();
  const id = "deal-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  const now = new Date().toISOString();
  await pool.query(
    `insert into deals (
      id, title, url, image_url, category, post_text, generate, publish,
      post_date, promotion_days, status, created_at, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, $13::timestamptz)`,
    [
      id,
      payload.title,
      payload.url,
      payload.imageUrl,
      payload.category,
      payload.postText,
      payload.generate,
      payload.publish,
      payload.postDate ?? null,
      payload.promotionDays,
      payload.status,
      now,
      now,
    ]
  );
  const res = await pool.query(`select * from deals where id = $1`, [id]);
  return rowToDeal(res.rows[0] as DealRow);
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
  const values: unknown[] = [];
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
    return existing.rowCount ? rowToDeal(existing.rows[0] as DealRow) : null;
  }

  updates.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `update deals set ${updates.join(", ")} where id = $${values.length} returning *`,
    values
  );
  return res.rowCount ? rowToDeal(res.rows[0] as DealRow) : null;
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
  return res.rowCount ? rowToDeal(res.rows[0] as DealRow) : null;
}

export type DealStats = {
  total: number;
  actief: number;
  concept: number;
  ingepland: number;
  gepubliceerd: number;
  beeindigd: number;
};

export async function pgGetDealStats(): Promise<DealStats> {
  const pool = getPgPool();
  const res = await pool.query<{
    total: string;
    actief: string;
    concept: string;
    ingepland: string;
    gepubliceerd: string;
    beeindigd: string;
  }>(`
    select
      count(*)::text as total,
      count(*) filter (where status in ('SCHEDULED','PUBLISHED'))::text as actief,
      count(*) filter (where status = 'DRAFT')::text as concept,
      count(*) filter (where status = 'SCHEDULED')::text as ingepland,
      count(*) filter (where status = 'PUBLISHED')::text as gepubliceerd,
      count(*) filter (where status = 'ENDED')::text as beeindigd
    from deals
  `);

  const row = res.rows[0];
  const n = (v: string | undefined) => Number(v ?? "0");
  return {
    total: n(row?.total),
    actief: n(row?.actief),
    concept: n(row?.concept),
    ingepland: n(row?.ingepland),
    gepubliceerd: n(row?.gepubliceerd),
    beeindigd: n(row?.beeindigd),
  };
}

