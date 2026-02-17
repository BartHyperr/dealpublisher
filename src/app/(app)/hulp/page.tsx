"use client";

import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Rocket,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "intro",
    icon: BookOpen,
    title: "Wat is Hyperr Poster?",
    body: "Hyperr Poster helpt je om reisdeals te beheren en op Facebook te plannen en te publiceren. Je zoekt deals, plant ze in op de kalender en houdt overzicht over wat er al live staat.",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    href: "/dashboard",
    body: "Op het dashboard zie je in één oogopslag hoeveel deals je hebt, hoeveel er actief zijn en hoe ze verdeeld zijn over de statussen (concept, ingepland, gepubliceerd, beëindigd). Onderaan staat een embed van je Facebook-pagina, zodat je direct ziet wat er op de pagina staat.",
  },
  {
    id: "search",
    icon: Search,
    title: "Zoeken & inplannen",
    href: "/search-schedule",
    body: "Hier blader je door alle deals. Gebruik het zoekveld om te filteren op bestemming, hotel of deal-ID. De filterchips (Stedentrip, Vakantiepark, Wellness, enz.) beperken de lijst tot een categorie. Klik op een dealkaart om de deal te openen: je kunt dan de titel, tekst, afbeelding en publicatiedatum aanpassen en de deal inplannen of als concept bewaren.",
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "Kalender",
    href: "/calendar",
    body: "De kalender toont een maandoverzicht met alle ingeplande posts. Je kunt een deal naar een andere dag slepen om de publicatiedatum te wijzigen. In de zijbalk zie je ‘Aankomende posts’ en de status van je Facebook-kanaal, zodat je altijd weet wat er binnenkort online gaat.",
  },
  {
    id: "trips",
    icon: Rocket,
    title: "Actieve trips",
    href: "/active-trips",
    body: "De tabel met actieve trips bevat alle deals in één overzicht. Selecteer één of meerdere rijen via de checkbox; er verschijnt dan een balk met acties: geselecteerden inplannen (kies een datum), geselecteerden publiceren, of promotie beëindigen. Handig om snel meerdere deals tegelijk te verwerken.",
  },
  {
    id: "settings",
    icon: Settings,
    title: "Instellingen",
    href: "/settings",
    body: "In Instellingen kun je de database koppelen (PostgreSQL) en notificaties instellen. Je kunt per e-mail een melding krijgen wanneer een deal is afgelopen of bijna afloopt (X dagen van tevoren), en optioneel wekelijks een update met het aantal actieve campagnes, afgelopen week afgelopen en volgende week ingepland. Zet je e-mailadres en voorkeuren in de sectie Notificaties; een externe cron moet dagelijks de notificatie-API aanroepen om de e-mails te versturen. De database-sectie bevat uitleg over het schema en knoppen om de verbinding te testen of tabellen te initialiseren.",
  },
];

export default function HulpPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Hoe werkt Hyperr Poster?
          </h1>
          <p className="mt-2 text-slate-600">
            Korte uitleg van de functies voor eindgebruikers.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                id={section.id}
                className="p-6 border-primary/10 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {section.title}
                      {section.href && (
                        <Link href={section.href}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            Ga naar →
                          </Button>
                        </Link>
                      )}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {section.body}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-primary/10">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Snel naar
          </h3>
          <div className="flex flex-wrap gap-2">
            {sections
              .filter((s) => s.href)
              .map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.id} href={s.href!}>
                    <Button variant="secondary" size="sm" className="gap-1.5 border border-slate-200">
                      <Icon className="h-3.5 w-3.5" />
                      {s.title}
                    </Button>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
