"use client";

import * as React from "react";

import { useDealsStore } from "@/store/deals-store";

export function DealsHydrator() {
  const dealsCount = useDealsStore((s) => s.deals.length);
  const hasBrokenImages = useDealsStore((s) =>
    s.deals.some((d) => {
      const u = String(d.imageUrl || "");
      return (
        u.includes("photo-1559599238-7f33c66b2a40") ||
        u.includes("photo-1564846824493-44a4c42a3e5e") ||
        u.includes("photo-1501117716987-c8e1ecb210e0") ||
        u.includes("photo-1520962917961-22c48c3f8c0f") ||
        u.includes("photo-1526481280695-3c687fd643ed") ||
        u.includes("photo-1499696010181-025ef6e1a8f8")
      );
    })
  );
  const fetchDeals = useDealsStore((s) => s.actions.fetchDeals);

  React.useEffect(() => {
    if (!dealsCount || hasBrokenImages) void fetchDeals();
  }, [dealsCount, fetchDeals, hasBrokenImages]);

  return null;
}

