import type { ReactNode } from "react";

import { DealsHydrator } from "@/components/providers/deals-hydrator";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden bg-white border-b border-primary/10 px-4 py-3 flex items-center justify-between">
          <MobileNav />
          <div className="text-sm font-bold text-slate-900">DealPublisher</div>
          <div className="w-10" />
        </div>
        <DealsHydrator />
        {children}
      </main>
    </div>
  );
}

