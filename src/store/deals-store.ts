"use client";

import { create } from "zustand";
import { toast } from "sonner";

import type { Deal, DealStatus } from "@/types/deal";

export type CreateDealPayload = {
  title: string;
  url: string;
  imageUrl: string;
  category: string[];
  postText: string;
  postDate?: string;
  promotionDays: Deal["promotionDays"];
  publish: boolean;
  status?: Deal["status"];
};

export type DealFilters = {
  query: string;
  categories: string[];
  status?: DealStatus | "ALL";
};

type ModalState = { open: boolean; dealId: string | null };

type DealsState = {
  deals: Deal[];
  filters: DealFilters;
  selection: Set<string>;
  modal: ModalState;
  loading: boolean;

  actions: {
    fetchDeals: () => Promise<void>;
    setFilters: (patch: Partial<DealFilters>) => void;

    toggleSelected: (dealId: string) => void;
    clearSelection: () => void;
    selectMany: (ids: string[]) => void;

    openModal: (dealId: string | null) => void;
    closeModal: () => void;

    createDeal: (payload: CreateDealPayload) => Promise<Deal | null>;
    updateDeal: (dealId: string, patch: Partial<Deal>) => Promise<Deal | null>;
    bulkSchedule: (dealIds: string[], postDate: string) => Promise<void>;
    bulkPublish: (dealIds: string[]) => Promise<void>;
    endPromotion: (dealIds: string[]) => Promise<void>;
    regeneratePostText: (dealId: string) => Promise<string | null>;
  };
};

async function apiGetDeals(): Promise<Deal[]> {
  const res = await fetch("/api/deals", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load deals");
  const json = (await res.json()) as { deals: Deal[] };
  return json.deals;
}

async function apiPatchDeal(dealId: string, patch: Partial<Deal>): Promise<Deal> {
  const res = await fetch(`/api/deals/${dealId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update deal");
  const json = (await res.json()) as { deal: Deal };
  return json.deal;
}

async function apiPublishDeal(dealId: string): Promise<Deal> {
  const res = await fetch("/api/webhook/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dealId }),
  });
  if (!res.ok) throw new Error("Failed to publish deal");
  const json = (await res.json()) as { deal: Deal };
  return json.deal;
}

async function apiRegenerate(deal: Deal): Promise<string> {
  const res = await fetch("/api/ai/regenerate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: deal.title,
      url: deal.url,
      postText: deal.postText ?? "",
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "AI regenerate failed");
  }
  const json = (await res.json()) as { text: string };
  return json.text;
}

function upsertDeal(list: Deal[], updated: Deal) {
  const idx = list.findIndex((d) => d.id === updated.id);
  if (idx === -1) return [updated, ...list];
  const next = list.slice();
  next[idx] = updated;
  return next;
}

export const useDealsStore = create<DealsState>((set, get) => ({
  deals: [],
  filters: { query: "", categories: ["Alle deals"], status: "ALL" },
  selection: new Set<string>(),
  modal: { open: false, dealId: null },
  loading: false,

  actions: {
    fetchDeals: async () => {
      set({ loading: true });
      try {
        const deals = await apiGetDeals();
        set({ deals });
      } catch {
        toast.error("Deals laden mislukt");
      } finally {
        set({ loading: false });
      }
    },

    setFilters: (patch) => {
      set((s) => ({ filters: { ...s.filters, ...patch } }));
    },

    toggleSelected: (dealId) => {
      set((s) => {
        const next = new Set(s.selection);
        if (next.has(dealId)) next.delete(dealId);
        else next.add(dealId);
        return { selection: next };
      });
    },

    clearSelection: () => set({ selection: new Set() }),

    selectMany: (ids) =>
      set(() => ({
        selection: new Set(ids),
      })),

    openModal: (dealId) => set({ modal: { open: true, dealId } }),
    closeModal: () => set({ modal: { open: false, dealId: null } }),

    createDeal: async (payload) => {
      try {
        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...payload,
            status: payload.status ?? (payload.postDate || payload.publish ? "SCHEDULED" : "DRAFT"),
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to create deal");
        }
        const json = (await res.json()) as { deal: Deal };
        set((s) => ({ deals: [json.deal, ...s.deals] }));
        return json.deal;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Deal aanmaken mislukt");
        return null;
      }
    },

    updateDeal: async (dealId, patch) => {
      try {
        const deal = await apiPatchDeal(dealId, patch);
        set((s) => ({ deals: upsertDeal(s.deals, deal) }));
        return deal;
      } catch {
        toast.error("Opslaan mislukt");
        return null;
      }
    },

    bulkSchedule: async (dealIds, postDate) => {
      const ops = dealIds.map((id) =>
        apiPatchDeal(id, { postDate, status: "SCHEDULED" })
      );
      try {
        const updated = await Promise.all(ops);
        set((s) => ({
          deals: updated.reduce((acc, d) => upsertDeal(acc, d), s.deals),
          selection: new Set(),
        }));
        toast.success("Deals ingepland");
      } catch {
        toast.error("Bulk inplannen mislukt");
      }
    },

    bulkPublish: async (dealIds) => {
      try {
        const updated = await Promise.all(dealIds.map(apiPublishDeal));
        set((s) => ({
          deals: updated.reduce((acc, d) => upsertDeal(acc, d), s.deals),
          selection: new Set(),
        }));
        toast.success("Gepubliceerd naar Facebook");
      } catch {
        toast.error("Bulk publiceren mislukt");
      }
    },

    endPromotion: async (dealIds) => {
      try {
        const updated = await Promise.all(
          dealIds.map((id) => apiPatchDeal(id, { status: "ENDED", publish: false }))
        );
        set((s) => ({
          deals: updated.reduce((acc, d) => upsertDeal(acc, d), s.deals),
          selection: new Set(),
        }));
        toast.success("Promotie beëindigd");
      } catch {
        toast.error("Promotie beëindigen mislukt");
      }
    },

    regeneratePostText: async (dealId) => {
      const deal = get().deals.find((d) => d.id === dealId);
      if (!deal) return null;
      try {
        toast.message("AI genereert tekst…");
        const text = await apiRegenerate(deal);
        const updated = await apiPatchDeal(dealId, { postText: text, generate: "Yes" });
        set((s) => ({ deals: upsertDeal(s.deals, updated) }));
        toast.success("Tekst vernieuwd");
        return text;
      } catch {
        toast.error("AI regeneratie mislukt");
        return null;
      }
    },
  },
}));

export function useFilteredDeals() {
  const deals = useDealsStore((s) => s.deals);
  const filters = useDealsStore((s) => s.filters);

  const q = filters.query.trim().toLowerCase();
  const status = filters.status ?? "ALL";
  const cats = filters.categories;

  return deals.filter((d) => {
    const matchesQuery =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.url.toLowerCase().includes(q);

    const matchesStatus = status === "ALL" ? true : d.status === status;

    const matchesCats =
      !cats.length || cats.includes("Alle deals")
        ? true
        : d.category.some((c) => cats.includes(c));

    return matchesQuery && matchesStatus && matchesCats;
  });
}

