import type { NotificationSettings } from "@/types/notifications";
import { getPgPool } from "@/lib/db/postgres";
import { isPostgresEnabled } from "@/lib/db/postgres";

const DEFAULT_SETTINGS: NotificationSettings = {
  email: "",
  notifyOnEnded: false,
  notifyDaysBefore: null,
  weeklyDigest: false,
  updatedAt: new Date().toISOString(),
};

let inMemorySettings: NotificationSettings = { ...DEFAULT_SETTINGS };

export async function pgInitNotificationSchema() {
  const pool = getPgPool();
  await pool.query(`
    create table if not exists notification_settings (
      id int primary key default 1 check (id = 1),
      email text not null default '',
      notify_on_ended boolean not null default false,
      notify_days_before int null,
      weekly_digest boolean not null default false,
      updated_at timestamptz not null default now()
    );

    create table if not exists notification_log (
      id serial primary key,
      deal_id text not null,
      type text not null check (type in ('ended', 'ending_soon')),
      sent_at timestamptz not null default now()
    );
    create index if not exists notification_log_deal_type on notification_log (deal_id, type);

    create table if not exists weekly_digest_log (
      id serial primary key,
      sent_at timestamptz not null default now()
    );
  `);
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (isPostgresEnabled()) {
    try {
      const pool = getPgPool();
      const res = await pool.query(
        `select email, notify_on_ended, notify_days_before, weekly_digest, updated_at
         from notification_settings where id = 1`
      );
      const row = res.rows[0];
      if (row) {
        return {
          email: row.email ?? "",
          notifyOnEnded: Boolean(row.notify_on_ended),
          notifyDaysBefore: row.notify_days_before ?? null,
          weeklyDigest: Boolean(row.weekly_digest),
          updatedAt: row.updated_at,
        };
      }
    } catch {
      // fallback to in-memory
    }
  }
  return { ...inMemorySettings };
}

export async function saveNotificationSettings(
  patch: Partial<Omit<NotificationSettings, "updatedAt">>
): Promise<NotificationSettings> {
  const now = new Date().toISOString();
  const updated: NotificationSettings = {
    ...(await getNotificationSettings()),
    ...patch,
    updatedAt: now,
  };

  if (isPostgresEnabled()) {
    try {
      const pool = getPgPool();
      await pool.query(
        `insert into notification_settings (id, email, notify_on_ended, notify_days_before, weekly_digest, updated_at)
         values (1, $1, $2, $3, $4, $5::timestamptz)
         on conflict (id) do update set
           email = excluded.email,
           notify_on_ended = excluded.notify_on_ended,
           notify_days_before = excluded.notify_days_before,
           weekly_digest = excluded.weekly_digest,
           updated_at = excluded.updated_at`,
        [
          updated.email,
          updated.notifyOnEnded,
          updated.notifyDaysBefore,
          updated.weeklyDigest,
          updated.updatedAt,
        ]
      );
      return updated;
    } catch {
      // fallback
    }
  }

  inMemorySettings = updated;
  return updated;
}

export async function logNotificationSent(dealId: string, type: "ended" | "ending_soon"): Promise<void> {
  if (!isPostgresEnabled()) return;
  try {
    const pool = getPgPool();
    await pool.query(
      `insert into notification_log (deal_id, type) values ($1, $2)`,
      [dealId, type]
    );
  } catch {
    // ignore
  }
}

export async function getDealIdsAlreadyNotifiedEnded(sinceDays: number = 30): Promise<Set<string>> {
  if (!isPostgresEnabled()) return new Set();
  try {
    const pool = getPgPool();
    const res = await pool.query(
      `select distinct deal_id from notification_log where type = 'ended' and sent_at > now() - interval '1 day' * $1`,
      [sinceDays]
    );
    return new Set(res.rows.map((r: { deal_id: string }) => r.deal_id));
  } catch {
    return new Set();
  }
}

export async function getDealIdsAlreadyNotifiedEndingSoon(sinceDays: number = 7): Promise<Set<string>> {
  if (!isPostgresEnabled()) return new Set();
  try {
    const pool = getPgPool();
    const res = await pool.query(
      `select distinct deal_id from notification_log where type = 'ending_soon' and sent_at > now() - interval '1 day' * $1`,
      [sinceDays]
    );
    return new Set(res.rows.map((r: { deal_id: string }) => r.deal_id));
  } catch {
    return new Set();
  }
}

export async function wasWeeklyDigestSentInLastDays(days: number = 8): Promise<boolean> {
  if (!isPostgresEnabled()) return false;
  try {
    const pool = getPgPool();
    const res = await pool.query(
      `select 1 from weekly_digest_log where sent_at > now() - interval '1 day' * $1 limit 1`,
      [days]
    );
    return (res.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function logWeeklyDigestSent(): Promise<void> {
  if (!isPostgresEnabled()) return;
  try {
    const pool = getPgPool();
    await pool.query(`insert into weekly_digest_log (sent_at) values (now())`);
  } catch {
    // ignore
  }
}
