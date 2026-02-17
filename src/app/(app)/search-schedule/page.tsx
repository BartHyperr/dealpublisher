"use client";

import { Bell, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealCard } from "@/components/deals/deal-card";
import { cn } from "@/lib/utils";
import { useDealsStore, useFilteredDeals } from "@/store/deals-store";

export default function SearchSchedulePage() {
  const deals = useFilteredDeals();
  const loading = useDealsStore((s) => s.loading);
  const filters = useDealsStore((s) => s.filters);
  const setFilters = useDealsStore((s) => s.actions.setFilters);
  const openModal = useDealsStore((s) => s.actions.openModal);

  const categories = [
    { id: "Alle deals", label: "Alle deals" },
    { id: "Stedentrip", label: "🏙️ Stedentrip" },
    { id: "Vakantiepark", label: "🌲 Vakantiepark" },
    { id: "Wellness", label: "💆 Wellness" },
    { id: "Last Minute", label: "🏖️ Last Minute" },
    { id: "Theme Parks", label: "🎢 Pretparken" },
    { id: "Coastal", label: "⛵ Kust" },
  ];

  return (
    <>
      <header className="bg-white border-b border-primary/10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
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

          <div className="relative max-w-2xl">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <Input
              className="pl-11"
              placeholder="Zoek bestemmingen, hotels of deal-ID's..."
              value={filters.query}
              onChange={(e) => setFilters({ query: e.target.value })}
            />
          </div>

          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              Filters:
            </span>
            {categories.map((c) => {
              const selected =
                filters.categories.includes(c.id) ||
                (c.id === "Alle deals" && filters.categories.includes("Alle deals"));
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilters({ categories: [c.id] })}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    selected
                      ? "bg-primary text-white"
                      : "bg-white border border-primary/10 text-slate-600 hover:border-primary/40"
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-sm text-slate-500">Deals laden…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onClick={() => openModal(deal.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

