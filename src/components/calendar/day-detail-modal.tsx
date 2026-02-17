"use client";

import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

import type { Deal } from "@/types/deal";
import { formatPromotionRangeLong } from "@/lib/format";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DayDetailModal({
  open,
  onOpenChange,
  dateLabel,
  deals,
  onOpenDeal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  deals: Deal[];
  onOpenDeal: (dealId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ingeplande deals — {dateLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {deals.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              Geen ingeplande deals op deze datum.
            </p>
          ) : (
            <ul className="space-y-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDeal(deal.id);
                      onOpenChange(false);
                    }}
                    className="w-full text-left rounded-xl border border-slate-200 p-4 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        {deal.title}
                      </span>
                      <DealStatusBadge status={deal.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {deal.postDate ? (
                        <span>
                          Geplaatst:{" "}
                          {format(
                            parseISO(deal.postDate),
                            "EEEE d MMMM, HH:mm",
                            { locale: nl }
                          )}
                        </span>
                      ) : null}
                      <span>Looptijd: {formatPromotionRangeLong(deal)}</span>
                      {deal.promotionDays ? (
                        <span>{deal.promotionDays} dagen actief</span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
