"use client";

import * as React from "react";
import { CalendarDays, Flame, Upload } from "lucide-react";

import { ActiveTripsTable } from "@/components/active-trips/active-trips-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDealsStore } from "@/store/deals-store";

export default function ActiveTripsPage() {
  const deals = useDealsStore((s) => s.deals);
  const selection = useDealsStore((s) => s.selection);
  const toggleSelected = useDealsStore((s) => s.actions.toggleSelected);
  const updateDeal = useDealsStore((s) => s.actions.updateDeal);
  const bulkSchedule = useDealsStore((s) => s.actions.bulkSchedule);
  const bulkPublish = useDealsStore((s) => s.actions.bulkPublish);
  const endPromotion = useDealsStore((s) => s.actions.endPromotion);
  const clearSelection = useDealsStore((s) => s.actions.clearSelection);

  const selectedIds = React.useMemo(() => Array.from(selection), [selection]);

  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [scheduleDate, setScheduleDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Actieve trips</h1>
            <p className="mt-1 text-sm text-slate-500">
              Bulk acties verschijnen zodra je rijen selecteert.
            </p>
          </div>
          {selectedIds.length ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button variant="secondary" onClick={() => setScheduleOpen(true)}>
                <CalendarDays className="h-4 w-4" />
                Geselecteerden inplannen ({selectedIds.length})
              </Button>
              <Button onClick={() => bulkPublish(selectedIds)}>
                <Upload className="h-4 w-4" />
                Geselecteerden publiceren
              </Button>
              <Button variant="destructive" onClick={() => endPromotion(selectedIds)}>
                <Flame className="h-4 w-4" />
                Promotie beëindigen
              </Button>
            </div>
          ) : null}
        </div>

        <ActiveTripsTable
          deals={deals}
          selection={selection}
          onToggleSelected={toggleSelected}
          onTogglePublish={(id, next) => void updateDeal(id, { publish: next })}
        />

        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="p-0">
            <DialogHeader className="pb-4">
              <DialogTitle>Geselecteerden inplannen</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-2">
              <p className="text-sm text-slate-600">
                Kies een datum/tijd voor {selectedIds.length} geselecteerde deals.
              </p>
              <Input
                type="datetime-local"
                className="mt-3 bg-white border border-slate-200"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setScheduleOpen(false)}>
                Annuleren
              </Button>
              <Button
                onClick={async () => {
                  const iso = new Date(scheduleDate).toISOString();
                  await bulkSchedule(selectedIds, iso);
                  clearSelection();
                  setScheduleOpen(false);
                }}
              >
                Inplannen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

