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
import { format, isSameDay, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { CheckCircle2, Clock, PencilLine, Slash } from "lucide-react";

import type { Deal } from "@/types/deal";
import { cn } from "@/lib/utils";

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
}: {
  id: string;
  children: React.ReactNode;
  faded: boolean;
  highlight: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-white p-3 min-h-[140px] group relative",
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
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { dealId: deal.id },
      disabled: deal.status === "ENDED",
    });

  const Icon = statusIcon(deal.status);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full text-left p-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5",
        statusStyle(deal.status),
        deal.status === "ENDED" ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-60"
      )}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{deal.title}</span>
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
      const dt = parseISO(d.postDate);
      const key = format(dt, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(d);
      map.set(key, list);
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

  return (
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

            return (
              <DayDroppable
                key={key}
                id={`day:${key}`}
                faded={faded}
                highlight={highlight}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    highlight ? "font-bold text-primary" : "text-slate-900"
                  )}
                >
                  {isFirstOfMonth ? format(date, "d") : format(date, "d")}
                </span>

                <div className="mt-2 space-y-1.5">
                  {list.slice(0, 3).map((deal) => (
                    <DealChip
                      key={deal.id}
                      deal={deal}
                      onClick={() => onOpenDeal(deal.id)}
                    />
                  ))}
                  {list.length > 3 ? (
                    <div className="mt-1 text-[10px] font-bold text-primary">
                      +{list.length - 3} meer
                    </div>
                  ) : null}
                </div>
              </DayDroppable>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

