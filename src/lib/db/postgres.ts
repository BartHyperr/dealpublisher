import { Pool } from "pg";

type GlobalPg = typeof globalThis & {
  __DEALPUBLISHER_PG_POOL__?: Pool;
};

function getDatabaseUrl() {
  return process.env.DATABASE_URL;
}

export function isPostgresEnabled() {
  return process.env.DATA_SOURCE === "postgres" && Boolean(getDatabaseUrl());
}

export function getPgPool() {
  const g = globalThis as GlobalPg;
  if (!g.__DEALPUBLISHER_PG_POOL__) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    g.__DEALPUBLISHER_PG_POOL__ = new Pool({
      connectionString,
      // Let op: ssl handling gaat via DATABASE_URL opties (sslmode) of PG env vars
    });
  }
  return g.__DEALPUBLISHER_PG_POOL__;
}

export function maskDatabaseUrl(url: string) {
  // Mask alleen password in postgres://user:pass@host/db
  try {
    const u = new URL(url);
    if (u.password) u.password = "******";
    return u.toString();
  } catch {
    // fallback: eenvoudige masking
    return url.replace(/:(.*?)@/, ":******@");
  }
}

