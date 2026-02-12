"use client";

import * as React from "react";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CalendarDays, Sparkles } from "lucide-react";

import type { Deal } from "@/types/deal";
import { useDealsStore } from "@/store/deals-store";
import { cn } from "@/lib/utils";
import { formatPostDateLong } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";

const promotionDaysValues = [5, 7, 14, 21, 30] as const;

const formSchema = z.object({
  postText: z.string().min(1, "Post tekst is verplicht"),
  category: z.array(z.string()).min(1, "Kies minimaal 1 categorie"),
  postDate: z.string().optional(),
  promotionDays: z.union([
    z.literal(5),
    z.literal(7),
    z.literal(14),
    z.literal(21),
    z.literal(30),
  ]),
  publish: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function toDateTimeLocalValue(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function fromDateTimeLocalValue(v: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return d.toISOString();
}

export function EditDealModal() {
  const modal = useDealsStore((s) => s.modal);
  const deal = useDealsStore((s) =>
    modal.dealId ? s.deals.find((d) => d.id === modal.dealId) : undefined
  );

  const closeModal = useDealsStore((s) => s.actions.closeModal);
  const updateDeal = useDealsStore((s) => s.actions.updateDeal);
  const bulkPublish = useDealsStore((s) => s.actions.bulkPublish);
  const regeneratePostText = useDealsStore((s) => s.actions.regeneratePostText);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postText: "",
      category: [],
      postDate: undefined,
      promotionDays: 7,
      publish: false,
    },
  });

  React.useEffect(() => {
    if (!deal) return;
    form.reset({
      postText: deal.postText ?? "",
      category: deal.category ?? [],
      postDate: deal.postDate,
      promotionDays: deal.promotionDays,
      publish: deal.publish ?? false,
    });
  }, [deal, form]);

  const postText = form.watch("postText");
  const categories = form.watch("category");
  const promotionDays = form.watch("promotionDays");
  const publish = form.watch("publish");

  const [newCat, setNewCat] = React.useState("");

  const onSubmit = async (values: FormValues) => {
    if (!deal) return;

    const postDateIso = values.postDate ? values.postDate : undefined;
    const status: Deal["status"] =
      values.publish ? "SCHEDULED" : postDateIso ? "SCHEDULED" : "DRAFT";

    const saved = await updateDeal(deal.id, {
      postText: values.postText,
      category: values.category,
      postDate: postDateIso,
      promotionDays: values.promotionDays,
      publish: values.publish,
      status,
    });

    if (!saved) return;

    if (values.publish) {
      await bulkPublish([deal.id]);
      closeModal();
      return;
    }

    if (postDateIso) {
      toast.success("Deal ingepland");
      closeModal();
      return;
    }

    toast.success("Deal opgeslagen");
    closeModal();
  };

  const handleRegenerate = async () => {
    if (!deal) return;
    const text = await regeneratePostText(deal.id);
    if (text) form.setValue("postText", text, { shouldDirty: true });
  };

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setNewCat("");
      return;
    }
    form.setValue("category", [...categories, trimmed], { shouldDirty: true });
    setNewCat("");
  };

  const removeCategory = (c: string) => {
    form.setValue(
      "category",
      categories.filter((x) => x !== c),
      { shouldDirty: true }
    );
  };

  return (
    <Dialog open={modal.open} onOpenChange={(open) => (!open ? closeModal() : null)}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Deal bewerken</DialogTitle>
              {deal ? (
                <p className="mt-1 text-sm text-slate-500">
                  {deal.id} · {deal.title}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">—</p>
              )}
            </div>
            {deal ? <DealStatusBadge status={deal.status} /> : null}
          </div>
        </DialogHeader>

        {!deal ? (
          <div className="p-6 text-sm text-slate-500">Deal laden…</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-6 border-r border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Facebook post tekst
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Karakters: {postText?.length ?? 0}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRegenerate}
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Regenerate
                  </Button>
                </div>

                <div className="mt-3">
                  <Textarea
                    {...form.register("postText")}
                    placeholder="Schrijf hier je Facebook post..."
                    className="min-h-[220px]"
                  />
                  {form.formState.errors.postText ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600">
                      {form.formState.errors.postText.message}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Categories</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        placeholder="Categorie toevoegen…"
                        className="h-9 w-44 bg-white border border-slate-200"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addCategory}
                      >
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => removeCategory(c)}
                        className="px-3 py-1.5 rounded-full bg-white border border-primary/10 text-slate-700 text-sm font-medium hover:border-primary/40 transition-all"
                        title="Verwijderen"
                      >
                        {c}
                      </button>
                    ))}
                    {!categories.length ? (
                      <p className="text-xs text-slate-500">
                        Nog geen categorieën.
                      </p>
                    ) : null}
                  </div>
                  {form.formState.errors.category ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600">
                      {form.formState.errors.category.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Right */}
              <div className="p-6">
                <div className="rounded-2xl border border-primary/10 overflow-hidden bg-white shadow-sm">
                  <div className="relative h-44">
                    <Image
                      src={deal.imageUrl}
                      alt={deal.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg">
                        Actieve deal
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">
                      {deal.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 break-all">
                      {deal.url}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Status:{" "}
                        <span className="font-semibold text-slate-900">
                          {deal.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Days remaining:{" "}
                        <span className="font-semibold text-slate-900">
                          {deal.daysRemaining ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Datum online
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Huidig: {formatPostDateLong(deal.postDate)}
                  </p>
                  <Input
                    type="datetime-local"
                    className="mt-3 bg-white border border-slate-200"
                    value={toDateTimeLocalValue(form.watch("postDate"))}
                    onChange={(e) =>
                      form.setValue("postDate", fromDateTimeLocalValue(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="mt-6">
                  <p className="text-sm font-bold text-slate-900">Promotieduur</p>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {promotionDaysValues.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          form.setValue("promotionDays", d, { shouldDirty: true })
                        }
                        className={cn(
                          "h-10 rounded-xl text-sm font-bold border transition-all",
                          promotionDays === d
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-white text-slate-700 border-slate-200 hover:border-primary/40"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Publiceren</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Zet aan om direct te publiceren via webhook.
                    </p>
                  </div>
                  <Switch
                    checked={publish}
                    onCheckedChange={(v) =>
                      form.setValue("publish", v, { shouldDirty: true })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => closeModal()}
              >
                Annuleren
              </Button>
              <Button type="submit">Verzenden</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

