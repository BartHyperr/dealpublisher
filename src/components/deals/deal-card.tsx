"use client";

import Image from "next/image";
import { Calendar, Facebook } from "lucide-react";

import type { Deal } from "@/types/deal";
import { cn } from "@/lib/utils";
import { formatPostDateShort } from "@/lib/format";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";

export function DealCard({
  deal,
  onClick,
}: {
  deal: Deal;
  onClick?: () => void;
}) {
  const ended = deal.status === "ENDED";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left bg-white border border-primary/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300",
        ended && "opacity-80"
      )}
    >
      <div className={cn("relative h-48 overflow-hidden", ended && "grayscale")}>
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute top-3 left-3 flex gap-2">
          <DealStatusBadge status={deal.status} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3
            className={cn(
              "font-bold text-slate-900 line-clamp-1",
              ended && "text-slate-400 italic"
            )}
          >
            {deal.title}
          </h3>
          <span className={cn("text-primary font-bold", ended && "text-slate-400")}>
            {ended ? "Verlopen" : "€—"}
          </span>
        </div>
        <p
          className={cn(
            "text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed",
            ended && "text-slate-400 italic"
          )}
        >
          {deal.postText}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="h-4 w-4" />
            <span className="text-[10px] font-semibold">
              {formatPostDateShort(deal.postDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Facebook className="h-4 w-4" />
            <span className="text-[10px] font-semibold">
              {deal.postDate ? "FB Main" : "Geen preview"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

