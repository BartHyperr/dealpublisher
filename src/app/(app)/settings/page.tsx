"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Database, AlertTriangle, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DbStatus = {
  configured: boolean;
  enabled: boolean;
  databaseUrlMasked: string | null;
  canConnect: boolean;
  serverVersion: string | null;
  error: string | null;
};

async function fetchDbStatus(): Promise<DbStatus> {
  const res = await fetch("/api/settings/db", { cache: "no-store" });
  if (!res.ok) throw new Error("Status ophalen mislukt");
  return (await res.json()) as DbStatus;
}

export default function SettingsPage() {
  const [status, setStatus] = React.useState<DbStatus | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchDbStatus();
      setStatus(s);
    } catch {
      toast.error("Kon database status niet ophalen");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const snippet = `DATA_SOURCE=postgres
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dealpublisher?sslmode=disable"`;

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippet);
    toast.success("Snippet gekopieerd");
  };

  const testConnection = async () => {
    const res = await fetch("/api/settings/db/test", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Test verbinding mislukt");
      return;
    }
    toast.success("Verbinding met Postgres is OK");
    await refresh();
  };

  const initSchema = async () => {
    const res = await fetch("/api/settings/db/init", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Schema initialiseren mislukt");
      return;
    }
    toast.success("Database schema is geïnitialiseerd");
    await refresh();
  };

  const seedData = async () => {
    const res = await fetch("/api/settings/db/seed", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      count?: number;
    };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Seed data mislukt");
      return;
    }
    toast.success(`Seeded ${json.count ?? 0} deals`);
    await refresh();
  };

  const schemaSql = `create table if not exists deals (
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
create index if not exists deals_post_date_idx on deals (post_date);`;

  const ok = Boolean(status?.enabled && status?.configured && status?.canConnect);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="mt-2 text-slate-500">
              Configureer hier de Postgres koppeling voor DealPublisher.
            </p>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh status
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Database</h2>
              <p className="text-sm text-slate-500">
                Postgres connectie + schema initialisatie.
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                ok
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-amber-500/10 text-amber-700"
              }`}
            >
              {ok ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {ok ? "CONNECTED" : "NOT CONNECTED"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Status
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-slate-600">DATA_SOURCE=postgres</span>
                    <span className="font-bold text-slate-900">
                      {status?.enabled ? "Ja" : "Nee"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-600">DATABASE_URL gezet</span>
                    <span className="font-bold text-slate-900">
                      {status?.configured ? "Ja" : "Nee"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-600">Kan verbinden</span>
                    <span className="font-bold text-slate-900">
                      {status?.canConnect ? "Ja" : "Nee"}
                    </span>
                  </li>
                </ul>

                {status?.databaseUrlMasked ? (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      DATABASE_URL (masked)
                    </p>
                    <p className="mt-2 text-xs text-slate-600 break-all">
                      {status.databaseUrlMasked}
                    </p>
                  </div>
                ) : null}

                {status?.error ? (
                  <p className="mt-4 text-sm text-rose-600">{status.error}</p>
                ) : null}

                {status?.serverVersion ? (
                  <p className="mt-4 text-xs text-slate-500">
                    {status.serverVersion}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={testConnection} disabled={!status?.enabled}>
                  Test verbinding
                </Button>
                <Button
                  variant="secondary"
                  onClick={initSchema}
                  disabled={!status?.enabled}
                >
                  Initialiseer schema
                </Button>
                <Button
                  variant="secondary"
                  onClick={seedData}
                  disabled={!status?.enabled}
                >
                  Seed demo data
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Tip: zet eerst `DATA_SOURCE=postgres` + `DATABASE_URL` in je
                `dealpublisher/.env.local`, herstart de dev-server, en test dan
                opnieuw.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-200">
                  .env.local snippet
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={copySnippet}
                >
                  <Copy className="h-4 w-4" />
                  Kopieer
                </Button>
              </div>
              <pre className="mt-3 text-xs leading-relaxed overflow-auto whitespace-pre">
{snippet}
              </pre>
              <p className="mt-3 text-xs text-slate-300">
                Daarna draait de app automatisch op Postgres via de bestaande
                `/api/deals*` endpoints.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Developer uitleg (Postgres)
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              DealPublisher kan draaien op een mock in-memory datasource of op
              Postgres. Zodra `DATA_SOURCE=postgres` en `DATABASE_URL` gezet
              zijn, gebruiken de bestaande API routes automatisch Postgres.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Hoe werkt de switch?
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>
                    - Zet in `dealpublisher/.env.local`:
                    <span className="font-semibold">
                      {" "}
                      DATA_SOURCE=postgres
                    </span>{" "}
                    en een geldige{" "}
                    <span className="font-semibold">DATABASE_URL</span>.
                  </li>
                  <li>- Herstart `npm run dev` (env vars worden ingelezen bij start).</li>
                  <li>
                    - Initialiseer schema via knop{" "}
                    <span className="font-semibold">Initialiseer schema</span>
                    .
                  </li>
                  <li>
                    - (Dev) Seed demo data via{" "}
                    <span className="font-semibold">Seed demo data</span>.
                  </li>
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Endpoints die overschakelen: `GET /api/deals`, `PATCH
                  /api/deals/:id`, `POST /api/webhook/publish`.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-200">
                Schema (SQL)
              </p>
              <pre className="mt-3 text-xs leading-relaxed overflow-auto whitespace-pre">
{schemaSql}
              </pre>
              <p className="mt-3 text-xs text-slate-300">
                Mapping naar TypeScript type `Deal`: `image_url` ↔ `imageUrl`,
                `post_text` ↔ `postText`, `promotion_days` ↔ `promotionDays`,
                `post_date` ↔ `postDate`.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

