"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        draft: "bg-slate-500/90 text-white",
        scheduled: "bg-primary/90 text-white shadow-sm",
        published: "bg-emerald-500/90 text-white",
        ended: "bg-rose-500/90 text-white",
        outline:
          "bg-white border border-primary/10 text-slate-600 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

