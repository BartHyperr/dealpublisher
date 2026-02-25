"use client";

import * as React from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Facebook, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DealStats = {
  source: "postgres" | "mock";
  total: number;
  actief: number;
  concept: number;
  ingepland: number;
  gepubliceerd: number;
  beeindigd: number;
};

type Deal = {
  id: string;
  title: string;
  postDate?: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ENDED";
};

async function fetchStats(): Promise<DealStats> {
  const res = await fetch("/api/settings/deals/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Stats ophalen mislukt");
  return (await res.json()) as DealStats;
}

async function fetchDeals(): Promise<Deal[]> {
  const res = await fetch("/api/deals", { cache: "no-store" });
  if (!res.ok) throw new Error("Deals ophalen mislukt");
  const json = (await res.json()) as { deals: Deal[] };
  return json.deals;
}

type AiUsage = {
  todayRequests: number;
  todayCostUsd: number;
  limitUsd: number;
};

async function fetchAiUsage(): Promise<AiUsage | null> {
  const res = await fetch("/api/settings/ai-usage", { cache: "no-store" });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    todayRequests: number;
    todayCostUsd: number;
    limitUsd: number;
  };
  return {
    todayRequests: j.todayRequests ?? 0,
    todayCostUsd: j.todayCostUsd ?? 0,
    limitUsd: j.limitUsd ?? 10,
  };
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DealStats | null>(null);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [aiUsage, setAiUsage] = React.useState<AiUsage | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, ai] = await Promise.all([
        fetchStats(),
        fetchDeals(),
        fetchAiUsage(),
      ]);
      setStats(s);
      setDeals(d);
      setAiUsage(ai);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const postsTotal = React.useMemo(
    () => deals.filter((d) => Boolean(d.postDate)).length,
    [deals]
  );

  const postsToday = React.useMemo(() => {
    const now = new Date();
    return deals.filter((d) => d.postDate && isSameDay(parseISO(d.postDate), now))
      .length;
  }, [deals]);

  const fbHref = "https://www.facebook.com/foxgaatverder";
  const fbEmbed = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    fbHref
  )}&tabs=timeline&width=500&height=700&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-2 text-slate-500">
              Overzicht van posts en status in {stats?.source === "postgres" ? "Postgres" : "Mock"}.
            </p>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Vernieuwen
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Dashboard laden…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Deals (totaal)
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats?.total ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Posts (totaal)
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {postsTotal}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Vandaag
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {postsToday}
              </p>
              <p className="mt-1 text-xs text-slate-500">{format(new Date(), "dd MMM yyyy")}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Ingepland
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats?.ingepland ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Gepubliceerd
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats?.gepubliceerd ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Beëindigd
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats?.beeindigd ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                AI generaties vandaag
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {aiUsage?.todayRequests ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">credits</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                AI kosten vandaag
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                ${(aiUsage?.todayCostUsd ?? 0).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                limiet ${(aiUsage?.limitUsd ?? 10).toFixed(0)}/dag
              </p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Facebook embed
              </h2>
              <a
                href={fbHref}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-primary"
              >
                Openen
              </a>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Embed van de pagina <span className="font-semibold">foxgaatverder</span>. Let op: Facebook kan vragen om in te loggen.
            </p>

            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <iframe
                title="Facebook embed foxgaatverder"
                src={fbEmbed}
                width="100%"
                height={700}
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder={0}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Facebook className="h-4 w-4" />
              <span>Powered by Facebook Page Plugin</span>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900">Toelichting</h2>
            <p className="mt-2 text-sm text-slate-500">
              Deze statistieken komen uit de API `GET /api/settings/deals/stats` (Postgres of mock).
              “Posts (totaal)” is het aantal deals met een ingevulde <code className="px-1 rounded bg-slate-100">postDate</code>.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

