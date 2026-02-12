"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-primary/10 bg-white shadow-lg shadow-primary/10",
          title: "text-sm font-bold text-slate-900",
          description: "text-sm text-slate-600",
          actionButton: "bg-primary text-white",
          cancelButton: "bg-slate-100 text-slate-900",
        },
      }}
    />
  );
}

