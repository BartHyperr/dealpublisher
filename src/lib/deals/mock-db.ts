import { formatISO } from "date-fns";

import type { Deal, DealStatus } from "@/types/deal";
import { createSeedDeals } from "@/lib/deals/seed";
import { computeDaysRemaining, computePromotionEndDate } from "@/lib/deals/helpers";

type DbState = {
  deals: Deal[];
};

const FALLBACK_UNSPLASH =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

const BROKEN_UNSPLASH_PHOTO_IDS = [
  "photo-1559599238-7f33c66b2a40",
  "photo-1564846824493-44a4c42a3e5e",
  "photo-1501117716987-c8e1ecb210e0",
  "photo-1520962917961-22c48c3f8c0f",
  "photo-1526481280695-3c687fd643ed",
  "photo-1499696010181-025ef6e1a8f8",
];

function iso(dt: Date) {
  return formatISO(dt);
}

function repairImageUrl(url: string) {
  if (!url.includes("images.unsplash.com/photo-")) return url;
  for (const broken of BROKEN_UNSPLASH_PHOTO_IDS) {
    if (url.includes(broken)) return FALLBACK_UNSPLASH;
  }
  return url;
}

function repairState(state: DbState) {
  let changed = false;
  const next = state.deals.map((d) => {
    const fixed = repairImageUrl(d.imageUrl);
    if (fixed === d.imageUrl) return d;
    changed = true;
    return { ...d, imageUrl: fixed };
  });
  if (changed) state.deals = next;
}

function normalizeDeal(deal: Deal): Deal {
  const now = new Date();
  let promotionEndDate = deal.promotionEndDate;
  let daysRemaining = deal.daysRemaining;

  if (deal.postDate) {
    promotionEndDate = computePromotionEndDate(deal.postDate, deal.promotionDays);
    daysRemaining = deal.status === "ENDED" ? 0 : computeDaysRemaining(promotionEndDate);
  }

  return {
    ...deal,
    promotionEndDate,
    daysRemaining,
    updatedAt: iso(now),
  };
}

function getGlobalState(): DbState {
  const g = globalThis as unknown as { __DEALPUBLISHER_DB__?: DbState };
  if (!g.__DEALPUBLISHER_DB__) {
    g.__DEALPUBLISHER_DB__ = { deals: createSeedDeals() };
  }
  repairState(g.__DEALPUBLISHER_DB__);
  return g.__DEALPUBLISHER_DB__;
}

export const dealsDb = {
  getAll(): Deal[] {
    return getGlobalState().deals;
  },

  getById(id: string): Deal | undefined {
    return getGlobalState().deals.find((d) => d.id === id);
  },

  patchById(id: string, patch: Partial<Deal>): Deal | undefined {
    const state = getGlobalState();
    const idx = state.deals.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;

    const current = state.deals[idx];
    const next: Deal = normalizeDeal({ ...current, ...patch } as Deal);
    state.deals[idx] = next;
    return next;
  },

  bulkPatch(ids: string[], patch: Partial<Deal>): Deal[] {
    const updated: Deal[] = [];
    ids.forEach((id) => {
      const d = this.patchById(id, patch);
      if (d) updated.push(d);
    });
    return updated;
  },

  publishNow(id: string): Deal | undefined {
    const now = new Date();
    return this.patchById(id, {
      publish: true,
      status: "PUBLISHED" satisfies DealStatus,
      postDate: iso(now),
    });
  },
};

