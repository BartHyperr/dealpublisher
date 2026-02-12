import { addDays, differenceInCalendarDays, formatISO, parseISO } from "date-fns";

import type { Deal } from "@/types/deal";

export function computePromotionEndDate(
  postDateIso: string,
  promotionDays: Deal["promotionDays"]
) {
  const post = parseISO(postDateIso);
  const end = addDays(post, promotionDays);
  return formatISO(end, { representation: "date" });
}

export function computeDaysRemaining(promotionEndDateIso?: string) {
  if (!promotionEndDateIso) return undefined;
  const end = parseISO(promotionEndDateIso);
  const days = differenceInCalendarDays(end, new Date());
  return Math.max(days, 0);
}

