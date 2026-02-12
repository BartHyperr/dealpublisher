"use client";

import * as React from "react";
import { addMonths, compareAsc, eachDayOfInterval, endOfMonth, endOfWeek, format, isAfter, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Facebook } from "lucide-react";
import Image from "next/image";

import { CalendarMonth } from "@/components/calendar/calendar-month";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDealsStore } from "@/store/deals-store";

export default function CalendarPage() {
  const deals = useDealsStore((s) => s.deals);
  const updateDeal = useDealsStore((s) => s.actions.updateDeal);
  const openModal = useDealsStore((s) => s.actions.openModal);

  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const scheduledDeals = React.useMemo(
    () => deals.filter((d) => Boolean(d.postDate)),
    [deals]
  );

  const monthAgenda = React.useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return deals
      .filter((d) => d.postDate)
      .filter((d) => {
        const dt = parseISO(d.postDate!);
        return dt >= start && dt <= end;
      })
      .sort((a, b) => compareAsc(parseISO(a.postDate!), parseISO(b.postDate!)));
  }, [deals, month]);

  const upcoming = React.useMemo(() => {
    const now = new Date();
    return deals
      .filter(
        (d) =>
          (d.status === "SCHEDULED" || d.status === "PUBLISHED") &&
          d.postDate &&
          isAfter(parseISO(d.postDate), now)
      )
      .sort((a, b) => compareAsc(parseISO(a.postDate!), parseISO(b.postDate!)))
      .slice(0, 5);
  }, [deals]);

  const moveDealToDate = async (dealId: string, targetDay: Date) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const next = new Date(targetDay);
    const t = deal.postDate ? parseISO(deal.postDate) : null;
    next.setHours(t ? t.getHours() : 14, t ? t.getMinutes() : 30, 0, 0);

    const nextStatus =
      deal.status === "PUBLISHED" || deal.status === "ENDED"
        ? deal.status
        : "SCHEDULED";

    await updateDeal(dealId, { postDate: next.toISOString(), status: nextStatus });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {format(month, "MMMM yyyy")}
              </h1>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setMonth((m) => subMonths(m, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMonth(startOfMonth(new Date()))}
                >
                  Vandaag
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Tabs defaultValue="month">
              <TabsList>
                <TabsTrigger value="month">Maand</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Button>Nieuwe deal</Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 px-1 text-xs font-medium text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Concept
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Ingepland
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Gepubliceerd
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 opacity-60" />{" "}
            Beëindigd
          </div>
        </div>

        <div className="hidden md:block">
          <CalendarMonth
            month={month}
            days={days}
            deals={scheduledDeals}
            onMoveDealToDate={moveDealToDate}
            onOpenDeal={(id) => openModal(id)}
          />
        </div>

        <div className="md:hidden rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Agenda (deze maand)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Op mobiel tonen we een lijst in plaats van een maand-grid.
          </p>
          <div className="mt-3 space-y-2">
            {monthAgenda.length ? (
              monthAgenda.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openModal(d.id)}
                  className="w-full text-left rounded-xl border border-slate-200 p-3 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {d.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {d.postDate ? format(parseISO(d.postDate), "EEEE dd MMM, HH:mm") : "—"}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-primary whitespace-nowrap">
                      {d.status}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">Geen posts deze maand.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-8">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Aankomende posts</h3>
              <button className="text-xs font-semibold text-primary">
                Bekijk wachtrij
              </button>
            </div>
            <div className="space-y-4">
              {upcoming.length ? (
                upcoming.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => openModal(d.id)}
                    className="w-full text-left flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="relative w-12 h-12 bg-slate-200 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={d.imageUrl}
                        alt={d.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {d.title}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Facebook className="h-3.5 w-3.5" /> Post naar Deals-pagina
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">
                        {d.postDate ? format(parseISO(d.postDate), "dd MMM") : "—"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {d.postDate ? format(parseISO(d.postDate), "HH:mm") : ""}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Geen aankomende posts.
                </p>
              )}
            </div>
          </div>

          <div className="w-1/3 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hidden lg:block">
            <h3 className="font-bold mb-4 text-slate-900">Kanaalgezondheid</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Facebook primair</span>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ACTIEF
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Facebook Wellness</span>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ACTIEF
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">
                  Publicatielimiet
                </p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[65%] rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  13 van 20 deals ingepland deze week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

