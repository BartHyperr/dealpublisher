import type { ReactNode } from "react";

import { DealsHydrator } from "@/components/providers/deals-hydrator";
import { Sidebar } from "@/components/nav/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DealsHydrator />
        {children}
      </main>
    </div>
  );
}

