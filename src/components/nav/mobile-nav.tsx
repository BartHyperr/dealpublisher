"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, HelpCircle, LayoutDashboard, Menu, Rocket, Search, Settings, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search-schedule", label: "Zoeken & inplannen", icon: Search },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/active-trips", label: "Actieve trips", icon: Rocket },
  { href: "/settings", label: "Instellingen", icon: Settings },
  { href: "/hulp", label: "Hulp", icon: HelpCircle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0">
        <div className="p-5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
              Hyperr<span className="text-slate-900"> Poster</span>
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
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
                    : "text-slate-600 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

