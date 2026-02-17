"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  HelpCircle,
  LayoutDashboard,
  Rocket,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search-schedule", label: "Zoeken & inplannen", icon: Search },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/active-trips", label: "Actieve trips", icon: Rocket },
  { href: "/settings", label: "Instellingen", icon: Settings },
  { href: "/hulp", label: "Hulp", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-primary/10 flex flex-col h-full z-20">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">
            Hyperr<span className="text-slate-900"> Poster</span>
          </span>
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-primary/5">
        <div className="bg-primary/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden" />
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">
                Beheerder
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Hyperr Poster</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

