"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { eachDayOfInterval, format, isSameDay, isSameMonth, parseISO, startOfDay, startOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
import { CheckCircle2, Clock, PencilLine, Slash } from "lucide-react";

import type { Deal } from "@/types/deal";
import { computePromotionEndDate } from "@/lib/deals/helpers";
import { formatPromotionRangeShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DayDetailModal } from "@/components/calendar/day-detail-modal";

function statusStyle(status: Deal["status"]) {
  if (status === "PUBLISHED") return "bg-emerald-500 text-white";
  if (status === "SCHEDULED") return "bg-primary text-white";
  if (status === "DRAFT") return "bg-slate-400 text-white";
  return "bg-rose-400/50 text-slate-700 line-through opacity-70";
}

function statusIcon(status: Deal["status"]) {
  if (status === "PUBLISHED") return CheckCircle2;
  if (status === "SCHEDULED") return Clock;
  if (status === "DRAFT") return PencilLine;
  return Slash;
}

function DayDroppable({
  id,
  children,
  faded,
  highlight,
  onDayClick,
  dayTitle,
}: {
  id: string;
  children: React.ReactNode;
  faded: boolean;
  highlight: boolean;
  onDayClick?: () => void;
  dayTitle?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      role={onDayClick ? "button" : undefined}
      tabIndex={onDayClick ? 0 : undefined}
      onClick={onDayClick}
      onKeyDown={onDayClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDayClick(); } } : undefined}
      title={dayTitle}
      className={cn(
        "bg-white p-3 min-h-[140px] group relative cursor-pointer",
        faded && "opacity-40 bg-slate-50/50",
        highlight && "border-2 border-primary/20 bg-primary/5",
        isOver && "ring-2 ring-primary/30"
      )}
    >
      {children}
    </div>
  );
}

function DealChip({
  deal,
  onClick,
}: {
  deal: Deal;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { dealId: deal.id },
      disabled: deal.status === "ENDED",
    });

  const Icon = statusIcon(deal.status);
  const rangeText = deal.postDate ? formatPromotionRangeShort(deal) : "";

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full text-left p-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 min-w-0",
        statusStyle(deal.status),
        deal.status === "ENDED" ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-60"
      )}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      title={rangeText ? `${deal.title} · ${rangeText}` : deal.title}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate min-w-0 flex-1">{deal.title}</span>
    </button>
  );
}

export function CalendarMonth({
  month,
  days,
  deals,
  onMoveDealToDate,
  onOpenDeal,
}: {
  month: Date;
  days: Date[];
  deals: Deal[];
  onMoveDealToDate: (dealId: string, date: Date) => void;
  onOpenDeal: (dealId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const dealsByDay = React.useMemo(() => {
    const map = new Map<string, Deal[]>();
    deals.forEach((d) => {
      if (!d.postDate) return;
      const start = startOfDay(parseISO(d.postDate));
      const endIso = d.promotionEndDate ?? computePromotionEndDate(d.postDate, d.promotionDays);
      const end = startOfDay(parseISO(endIso));
      const dayKeys = eachDayOfInterval({ start, end }).map((date) => format(date, "yyyy-MM-dd"));
      dayKeys.forEach((key) => {
        const list = map.get(key) ?? [];
        list.push(d);
        map.set(key, list);
      });
    });
    return map;
  }, [deals]);

  const handleDragEnd = (event: DragEndEvent) => {
    const dealId = event.active?.id as string | undefined;
    const overId = event.over?.id as string | undefined;
    if (!dealId || !overId) return;
    if (!overId.startsWith("day:")) return;
    const dateKey = overId.replace("day:", "");
    const target = new Date(`${dateKey}T12:00:00.000Z`);
    onMoveDealToDate(dealId, target);
  };

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const currentMonth = startOfMonth(month);
  const [expandedDayKey, setExpandedDayKey] = React.useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = React.useState<string | null>(null);

  const maxVisibleDefault = 1;

  const selectedDayDeals = selectedDayKey ? (dealsByDay.get(selectedDayKey) ?? []) : [];
  const selectedDayLabel = selectedDayKey
    ? format(parseISO(selectedDayKey + "T12:00:00"), "EEEE d MMMM yyyy", { locale: nl })
    : "";

  return (
    <>
      <DayDetailModal
        open={Boolean(selectedDayKey)}
        onOpenChange={(open) => !open && setSelectedDayKey(null)}
        dateLabel={selectedDayLabel}
        deals={selectedDayDeals}
        onOpenDeal={onOpenDeal}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"].map(
            (d) => (
              <div
                key={d}
                className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                {d}
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {days.map((date) => {
            const key = format(date, "yyyy-MM-dd");
            const faded = !isSameMonth(date, currentMonth);
            const highlight = key === todayKey;
            const isFirstOfMonth = isSameDay(date, startOfMonth(currentMonth));

            const list = dealsByDay.get(key) ?? [];
            const isExpanded = expandedDayKey === key;
            const visibleList = isExpanded ? list : list.slice(0, maxVisibleDefault);
            const moreCount = list.length - maxVisibleDefault;

            return (
              <DayDroppable
                key={key}
                id={`day:${key}`}
                faded={faded}
                highlight={highlight}
                onDayClick={() => setSelectedDayKey(key)}
                dayTitle={`Bekijk deals op ${format(date, "d MMMM yyyy", { locale: nl })}`}
              >
                <span
                  className={cn(
                    "text-sm font-medium block",
                    highlight ? "font-bold text-primary" : "text-slate-900"
                  )}
                >
                  {isFirstOfMonth ? format(date, "d") : format(date, "d")}
                </span>

                <div className="mt-2 space-y-1.5 min-h-[80px]">
                  {visibleList.map((deal) => (
                    <DealChip
                      key={deal.id}
                      deal={deal}
                      onClick={() => onOpenDeal(deal.id)}
                    />
                  ))}
                  {moreCount > 0 && !isExpanded ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDayKey(key);
                      }}
                      className="mt-1 text-[10px] font-bold text-primary hover:underline"
                    >
                      +{moreCount} meer
                    </button>
                  ) : null}
                  {moreCount > 0 && isExpanded ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDayKey(null);
                      }}
                      className="mt-1 text-[10px] font-bold text-slate-500 hover:underline"
                    >
                      Inklappen
                    </button>
                  ) : null}
                </div>
              </DayDroppable>
            );
          })}
        </div>
      </div>
    </DndContext>
    </>
  );
}

