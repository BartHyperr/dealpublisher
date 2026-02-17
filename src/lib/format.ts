import { format, parseISO } from "date-fns";

import type { Deal } from "@/types/deal";
import { computePromotionEndDate } from "@/lib/deals/helpers";

/** Korte weergave looptijd voor in de kalender: "12–19 feb" of "7 dagen" */
export function formatPromotionRangeShort(deal: Deal): string {
  if (!deal.postDate) return "";
  const start = parseISO(deal.postDate);
  const endIso = deal.promotionEndDate ?? computePromotionEndDate(deal.postDate, deal.promotionDays);
  const end = parseISO(endIso);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) return `${format(start, "d")}–${format(end, "d MMM")}`;
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

/** Langere weergave: "12 feb – 19 feb" */
export function formatPromotionRangeLong(deal: Deal): string {
  if (!deal.postDate) return "—";
  const start = parseISO(deal.postDate);
  const endIso = deal.promotionEndDate ?? computePromotionEndDate(deal.postDate, deal.promotionDays);
  const end = parseISO(endIso);
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

export function formatPostDateShort(iso?: string) {
  if (!iso) return "Niet ingesteld";
  try {
    const dt = parseISO(iso);
    return format(dt, "MMM dd, HH:mm").toUpperCase();
  } catch {
    return iso;
  }
}

export function formatPostDateLong(iso?: string) {
  if (!iso) return "—";
  try {
    const dt = parseISO(iso);
    return format(dt, "dd MMM yyyy, HH:mm");
  } catch {
    return iso;
  }
}

