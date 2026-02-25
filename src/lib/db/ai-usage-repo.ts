import { getPgPool } from "@/lib/db/postgres";
import { isPostgresEnabled } from "@/lib/db/postgres";

/** gpt-4o-mini: $0.15/1M input, $0.60/1M output (USD) */
const INPUT_COST_PER_1M = 0.15;
const OUTPUT_COST_PER_1M = 0.6;

export const AI_DAILY_LIMIT_USD = 10;

export function computeAiCost(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * INPUT_COST_PER_1M +
    (completionTokens / 1_000_000) * OUTPUT_COST_PER_1M
  );
}

export type TodayAiUsage = {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  limitUsd: number;
};

const inMemoryToday: TodayAiUsage = {
  requests: 0,
  promptTokens: 0,
  completionTokens: 0,
  costUsd: 0,
  limitUsd: AI_DAILY_LIMIT_USD,
};

export async function pgInitAiUsageSchema() {
  const pool = getPgPool();
  await pool.query(`
    create table if not exists ai_usage_log (
      id serial primary key,
      used_at timestamptz not null default now(),
      prompt_tokens int not null default 0,
      completion_tokens int not null default 0,
      cost_usd numeric(12, 6) not null default 0
    );
    create index if not exists ai_usage_log_used_at on ai_usage_log (used_at);
  `);
}

async function queryTodayUsage(pool: Awaited<ReturnType<typeof getPgPool>>) {
  const res = await pool.query(
    `select
       count(*)::int as requests,
       coalesce(sum(prompt_tokens), 0)::int as prompt_tokens,
       coalesce(sum(completion_tokens), 0)::int as completion_tokens,
       coalesce(sum(cost_usd), 0)::double precision as cost_usd
     from ai_usage_log
     where used_at >= date_trunc('day', now())
       and used_at < date_trunc('day', now()) + interval '1 day'`
  );
  return res.rows[0];
}

export async function getTodayAiUsage(): Promise<TodayAiUsage> {
  if (isPostgresEnabled()) {
    try {
      const pool = getPgPool();
      const row = await queryTodayUsage(pool);
      if (row) {
        return {
          requests: Number(row.requests) || 0,
          promptTokens: Number(row.prompt_tokens) || 0,
          completionTokens: Number(row.completion_tokens) || 0,
          costUsd: Number(row.cost_usd) || 0,
          limitUsd: AI_DAILY_LIMIT_USD,
        };
      }
    } catch {
      try {
        await pgInitAiUsageSchema();
        const pool = getPgPool();
        const row = await queryTodayUsage(pool);
        if (row) {
          return {
            requests: Number(row.requests) || 0,
            promptTokens: Number(row.prompt_tokens) || 0,
            completionTokens: Number(row.completion_tokens) || 0,
            costUsd: Number(row.cost_usd) || 0,
            limitUsd: AI_DAILY_LIMIT_USD,
          };
        }
      } catch {
        // fallback
      }
    }
  }
  return { ...inMemoryToday };
}

export async function logAiUsage(
  promptTokens: number,
  completionTokens: number,
  costUsd: number
): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      const pool = getPgPool();
      await pool.query(
        `insert into ai_usage_log (prompt_tokens, completion_tokens, cost_usd)
         values ($1, $2, $3)`,
        [promptTokens, completionTokens, costUsd]
      );
      return;
    } catch {
      try {
        await pgInitAiUsageSchema();
        const pool = getPgPool();
        await pool.query(
          `insert into ai_usage_log (prompt_tokens, completion_tokens, cost_usd)
           values ($1, $2, $3)`,
          [promptTokens, completionTokens, costUsd]
        );
        return;
      } catch {
        // fallback to in-memory
      }
    }
  }
  inMemoryToday.requests += 1;
  inMemoryToday.promptTokens += promptTokens;
  inMemoryToday.completionTokens += completionTokens;
  inMemoryToday.costUsd += costUsd;
}
