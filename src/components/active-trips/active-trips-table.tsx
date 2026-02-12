"use client";

import * as React from "react";
import Image from "next/image";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Check, Link2 } from "lucide-react";

import type { Deal } from "@/types/deal";
import { cn } from "@/lib/utils";
import { formatPostDateLong } from "@/lib/format";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function GenerateCell({ deal }: { deal: Deal }) {
  const ready = deal.generate === "Yes";
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className={ready ? "text-emerald-600" : "text-slate-500"}>
          {ready ? "Ready" : "Processing"}
        </span>
        {ready ? <Check className="h-4 w-4 text-emerald-600" /> : null}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full", ready ? "bg-emerald-500 w-full" : "bg-primary w-[45%]")}
        />
      </div>
    </div>
  );
}

export function ActiveTripsTable({
  deals,
  selection,
  onToggleSelected,
  onTogglePublish,
  pageSize = 10,
}: {
  deals: Deal[];
  selection: Set<string>;
  onToggleSelected: (id: string) => void;
  onTogglePublish: (id: string, next: boolean) => void;
  pageSize?: number;
}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageCount = Math.max(1, Math.ceil(deals.length / pageSize));
  const pageDeals = React.useMemo(
    () => deals.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [deals, pageIndex, pageSize]
  );

  const columns = React.useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        id: "select",
        header: () => <span className="sr-only">Select</span>,
        cell: ({ row }) => {
          const id = row.original.id;
          const checked = selection.has(id);
          return (
            <input
              type="checkbox"
              className="h-4 w-4 accent-[--color-primary]"
              checked={checked}
              onChange={() => onToggleSelected(id)}
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Deal",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-3 min-w-[360px]">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <Image src={d.imageUrl} alt={d.title} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {d.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="truncate">{d.url}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "generate",
        header: "Generate",
        cell: ({ row }) => <GenerateCell deal={row.original} />,
      },
      {
        accessorKey: "promotionDays",
        header: "Promotion length",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-700">
            {row.original.promotionDays} days
          </span>
        ),
      },
      {
        id: "publish",
        header: "Publish",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <Switch
              checked={d.publish}
              onCheckedChange={(v) => onTogglePublish(d.id, v)}
            />
          );
        },
      },
      {
        accessorKey: "postDate",
        header: "Post date",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatPostDateLong(row.original.postDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <DealStatusBadge status={row.original.status} />,
      },
    ],
    [onTogglePublish, onToggleSelected, selection]
  );

  const table = useReactTable({
    data: pageDeals,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-2xl border border-primary/5 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={cn(
                      "px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest",
                      h.id === "select" && "w-12"
                    )}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => {
              const ended = row.original.status === "ENDED";
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "hover:bg-primary/5 transition-colors",
                    ended && "opacity-60"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
        <div className="text-xs text-slate-500">
          Page <span className="font-bold text-slate-900">{pageIndex + 1}</span>{" "}
          of <span className="font-bold text-slate-900">{pageCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

