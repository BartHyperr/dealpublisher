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
    const isLocalhost =
      /^(?:postgres(?:ql)?:\/\/)[^\/]*@?(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(
        connectionString
      ) || connectionString.includes("localhost");
    g.__DEALPUBLISHER_PG_POOL__ = new Pool({
      connectionString,
      ssl:
        isLocalhost || connectionString.includes("sslmode=disable")
          ? false
          : { rejectUnauthorized: false },
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

