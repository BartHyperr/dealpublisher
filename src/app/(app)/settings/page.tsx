"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Database, AlertTriangle, Copy, Mail } from "lucide-react";

import type { NotificationSettings } from "@/types/notifications";
import { NOTIFY_DAYS_OPTIONS } from "@/types/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type DbStatus = {
  configured: boolean;
  enabled: boolean;
  databaseUrlMasked: string | null;
  canConnect: boolean;
  serverVersion: string | null;
  error: string | null;
};

type DealStats = {
  source: "postgres" | "mock";
  total: number;
  actief: number;
  concept: number;
  ingepland: number;
  gepubliceerd: number;
  beeindigd: number;
};

async function fetchDbStatus(): Promise<DbStatus> {
  const res = await fetch("/api/settings/db", { cache: "no-store" });
  if (!res.ok) throw new Error("Status ophalen mislukt");
  return (await res.json()) as DbStatus;
}

async function fetchDealStats(): Promise<DealStats> {
  const res = await fetch("/api/settings/deals/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Statistieken ophalen mislukt");
  return (await res.json()) as DealStats;
}

async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await fetch("/api/settings/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error("Notificatie-instellingen ophalen mislukt");
  return res.json() as Promise<NotificationSettings>;
}

export default function SettingsPage() {
  const [status, setStatus] = React.useState<DbStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DealStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [notif, setNotif] = React.useState<NotificationSettings | null>(null);
  const [notifLoading, setNotifLoading] = React.useState(true);
  const [notifSaving, setNotifSaving] = React.useState(false);

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

  const refreshStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchDealStats();
      setStats(s);
    } catch {
      toast.error("Kon deal statistieken niet ophalen");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshNotif = React.useCallback(async () => {
    setNotifLoading(true);
    try {
      const s = await fetchNotificationSettings();
      setNotif(s);
    } catch {
      toast.error("Kon notificatie-instellingen niet ophalen");
    } finally {
      setNotifLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    void refreshStats();
    void refreshNotif();
  }, [refresh, refreshStats, refreshNotif]);

  const saveNotif = async () => {
    if (!notif) return;
    setNotifSaving(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: notif.email,
          notifyOnEnded: notif.notifyOnEnded,
          notifyDaysBefore: notif.notifyDaysBefore,
          weeklyDigest: notif.weeklyDigest,
        }),
      });
      if (!res.ok) throw new Error("Opslaan mislukt");
      const updated = (await res.json()) as NotificationSettings;
      setNotif(updated);
      toast.success("Notificatie-instellingen opgeslagen");
    } catch {
      toast.error("Kon notificaties niet opslaan");
    } finally {
      setNotifSaving(false);
    }
  };

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
    toast.success(`Demo-data gevuld: ${json.count ?? 0} deals`);
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
            <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
            <p className="mt-2 text-slate-500">
              Configureer hier de Postgres koppeling voor Hyperr Poster.
            </p>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Vernieuw status
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Deal statistieken
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Overzicht van hoeveel deals er in de huidige datasource staan.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={refreshStats}
              disabled={statsLoading}
            >
              Vernieuw statistieken
            </Button>
          </div>

          {statsLoading ? (
            <p className="mt-4 text-sm text-slate-500">Statistieken laden…</p>
          ) : stats ? (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Totaal
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stats.total}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Bron: {stats.source === "postgres" ? "Postgres" : "Mock"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Actief
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stats.actief}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ingepland + gepubliceerd
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Concept
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stats.concept}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Ingepland
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stats.ingepland}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Gepubliceerd
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stats.gepubliceerd}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Beëindigd
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stats.beeindigd}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Geen data.</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Notificaties</h2>
              <p className="text-sm text-slate-500">
                E-mail bij afgelopen deal, bijna aflopende deal en wekelijkse update.
              </p>
            </div>
          </div>

          {notifLoading ? (
            <p className="mt-4 text-sm text-slate-500">Laden…</p>
          ) : notif ? (
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  E-mailadres
                </label>
                <Input
                  type="email"
                  value={notif.email}
                  onChange={(e) => setNotif({ ...notif, email: e.target.value })}
                  placeholder="jouw@email.nl"
                  className="max-w-md bg-white border border-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Alle notificaties worden naar dit adres gestuurd.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">E-mail bij afgelopen deal</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Ontvang een e-mail wanneer een deal is beëindigd.
                  </p>
                </div>
                <Switch
                  checked={notif.notifyOnEnded}
                  onCheckedChange={(v) => setNotif({ ...notif, notifyOnEnded: v })}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      E-mail wanneer deal bijna afloopt
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Stuur een herinnering X dagen vóór de einddatum.
                    </p>
                  </div>
                  <Switch
                    checked={notif.notifyDaysBefore !== null && notif.notifyDaysBefore > 0}
                    onCheckedChange={(v) =>
                      setNotif({
                        ...notif,
                        notifyDaysBefore: v ? 2 : null,
                      })
                    }
                  />
                </div>
                {notif.notifyDaysBefore !== null && notif.notifyDaysBefore > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-sm text-slate-600">Stuur e-mail</span>
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      value={notif.notifyDaysBefore}
                      onChange={(e) =>
                        setNotif({
                          ...notif,
                          notifyDaysBefore: Number(e.target.value) as NotificationSettings["notifyDaysBefore"],
                        })
                      }
                    >
                      {NOTIFY_DAYS_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? "dag" : "dagen"} van tevoren
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">Wekelijkse update</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Elke week een e-mail met actieve campagnes, afgelopen week afgelopen en volgende week ingepland.
                  </p>
                </div>
                <Switch
                  checked={notif.weeklyDigest}
                  onCheckedChange={(v) => setNotif({ ...notif, weeklyDigest: v })}
                />
              </div>

              <Button onClick={saveNotif} disabled={notifSaving}>
                {notifSaving ? "Opslaan…" : "Notificatie-instellingen opslaan"}
              </Button>

              <p className="text-xs text-slate-500">
                Zet <code className="bg-slate-100 px-1 rounded">RESEND_API_KEY</code> en optioneel{" "}
                <code className="bg-slate-100 px-1 rounded">NOTIFICATION_FROM_EMAIL</code> in je
                omgeving. Laat een externe cron (bijv. cron-job.org) dagelijks{" "}
                <code className="bg-slate-100 px-1 rounded">GET /api/cron/notifications</code> aanroepen
                met <code className="bg-slate-100 px-1 rounded">Authorization: Bearer CRON_SECRET</code>.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Kon instellingen niet laden.</p>
          )}
        </Card>

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
              {ok ? "VERBONDEN" : "NIET VERBONDEN"}
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
                  Demo-data vullen
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Tip: zet eerst `DATA_SOURCE=postgres` + `DATABASE_URL` in je
                `.env.local`, herstart de dev-server, en test dan
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
              Hyperr Poster kan draaien op een mock in-memory datasource of op
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
                    - Zet in `.env.local`:
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

