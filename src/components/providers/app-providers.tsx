"use client";

import * as React from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalModals } from "@/components/providers/global-modals";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      {children}
      <Toaster />
      <GlobalModals />
    </TooltipProvider>
  );
}

