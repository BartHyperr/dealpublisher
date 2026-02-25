"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Bell, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DealCard } from "@/components/deals/deal-card";
import { useDealsStore } from "@/store/deals-store";

const PAGE_SIZE = 12;
type SortKey = "title" | "updatedAt" | "postDate" | "status";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "title", label: "Titel" },
  { value: "updatedAt", label: "Laatst gewijzigd" },
  { value: "postDate", label: "Publicatiedatum" },
  { value: "status", label: "Status" },
];

export default function SearchSchedulePage() {
  const deals = useDealsStore((s) => s.deals);
  const loading = useDealsStore((s) => s.loading);
  const openModal = useDealsStore((s) => s.actions.openModal);

  const [sortBy, setSortBy] = React.useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);

  const sortedDeals = React.useMemo(() => {
    const list = [...deals];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "title") cmp = (a.title ?? "").localeCompare(b.title ?? "");
      else if (sortBy === "updatedAt") cmp = (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "");
      else if (sortBy === "postDate") {
        const ad = a.postDate ?? "";
        const bd = b.postDate ?? "";
        cmp = ad.localeCompare(bd);
      } else if (sortBy === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [deals, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedDeals.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paginatedDeals = sortedDeals.slice(start, start + PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [sortBy, sortDir]);

  return (
    <>
      <header className="bg-white border-b border-primary/10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">
              Deals zoeken &amp; inplannen
            </h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 hover:bg-primary/5 transition-all relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <Button className="h-11 px-6" onClick={() => openModal(null)}>
                <Plus className="h-4 w-4" />
                Nieuwe deal
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Sorteren op:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="gap-1.5"
            >
              {sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {sortDir === "asc" ? "Oplopend" : "Aflopend"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-sm text-slate-500">Deals laden…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {paginatedDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClick={() => openModal(deal.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Vorige
                  </Button>
                  <span className="px-4 text-sm text-slate-600">
                    Pagina {page} van {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Volgende
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

