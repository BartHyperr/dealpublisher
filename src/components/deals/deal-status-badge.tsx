"use client";

import type React from "react";
import { CheckCircle2, Clock, PencilLine, Slash } from "lucide-react";

import type { DealStatus } from "@/types/deal";
import { Badge } from "@/components/ui/badge";

const statusMeta: Record<
  DealStatus,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: "Concept", icon: PencilLine },
  SCHEDULED: { label: "Ingepland", icon: Clock },
  PUBLISHED: { label: "Gepubliceerd", icon: CheckCircle2 },
  ENDED: { label: "Beëindigd", icon: Slash },
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;

  const variant =
    status === "DRAFT"
      ? "draft"
      : status === "SCHEDULED"
        ? "scheduled"
        : status === "PUBLISHED"
          ? "published"
          : "ended";

  return (
    <Badge variant={variant} className="shadow-sm backdrop-blur-md">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

