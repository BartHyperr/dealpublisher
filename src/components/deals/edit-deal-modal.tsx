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
import { DealPreviewPost } from "@/components/deals/deal-preview-post";

const promotionDaysValues = [5, 7, 14, 21, 30] as const;
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

const formSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  postText: z.string().min(1, "Post tekst is verplicht"),
  category: z.array(z.string()).default([]),
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
  const createDeal = useDealsStore((s) => s.actions.createDeal);
  const updateDeal = useDealsStore((s) => s.actions.updateDeal);
  const bulkPublish = useDealsStore((s) => s.actions.bulkPublish);
  const regeneratePostText = useDealsStore((s) => s.actions.regeneratePostText);

  const isNew = modal.dealId === null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      imageUrl: DEFAULT_IMAGE,
      postText: "",
      category: [],
      postDate: undefined,
      promotionDays: 7,
      publish: false,
    },
  });

  React.useEffect(() => {
    if (isNew) {
      form.reset({
        title: "",
        url: "",
        imageUrl: DEFAULT_IMAGE,
        postText: "",
        category: [],
        postDate: undefined,
        promotionDays: 7,
        publish: false,
      });
      return;
    }
    if (!deal) return;
    form.reset({
      title: deal.title,
      url: deal.url,
      imageUrl: deal.imageUrl,
      postText: deal.postText ?? "",
      category: deal.category ?? [],
      postDate: deal.postDate,
      promotionDays: deal.promotionDays,
      publish: deal.publish ?? false,
    });
  }, [deal, isNew, form]);

  const postText = form.watch("postText");
  const title = form.watch("title");
  const url = form.watch("url");
  const imageUrl = form.watch("imageUrl");
  const promotionDays = form.watch("promotionDays");
  const publish = form.watch("publish");

  const onSubmit = async (values: FormValues) => {
    const postDateIso = values.postDate ? values.postDate : undefined;
    const status: Deal["status"] =
      values.publish ? "SCHEDULED" : postDateIso ? "SCHEDULED" : "DRAFT";

    if (isNew) {
      const title = (values.title ?? "").trim();
      if (!title) {
        form.setError("title", { message: "Titel is verplicht" });
        return;
      }
      const created = await createDeal({
        title,
        url: (values.url ?? "").trim() || "#",
        imageUrl: (values.imageUrl ?? "").trim() || DEFAULT_IMAGE,
        postText: values.postText,
        category: values.category,
        postDate: postDateIso,
        promotionDays: values.promotionDays,
        publish: values.publish,
        status,
      });
      if (!created) return;
      if (values.publish) await bulkPublish([created.id]);
      toast.success("Deal aangemaakt");
      closeModal();
      return;
    }

    if (!deal) return;

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
    if (isNew) {
      toast.message("AI-regeneratie is alleen beschikbaar na het aanmaken van de deal.");
      return;
    }
    if (!deal) return;
    const text = await regeneratePostText(deal.id);
    if (text) form.setValue("postText", text, { shouldDirty: true });
  };

  return (
    <Dialog open={modal.open} onOpenChange={(open) => (!open ? closeModal() : null)}>
      <DialogContent className="p-0 overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{isNew ? "Nieuwe deal" : "Deal bewerken"}</DialogTitle>
              {isNew ? (
                <p className="mt-1 text-sm text-slate-500">Vul de gegevens in en sla op.</p>
              ) : deal ? (
                <p className="mt-1 text-sm text-slate-500">
                  {deal.id} · {deal.title}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Deal laden…</p>
              )}
            </div>
            {deal ? <DealStatusBadge status={deal.status} /> : null}
          </div>
        </DialogHeader>

        {!isNew && !deal ? (
          <div className="p-6 text-sm text-slate-500">Deal laden…</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-4 sm:p-6 lg:border-r lg:border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Post caption
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
              </div>

              {/* Right */}
              <div className="p-4 sm:p-6 flex flex-col gap-4">
                <DealPreviewPost
                  title={title ?? ""}
                  url={url ?? ""}
                  imageUrl={imageUrl ?? DEFAULT_IMAGE}
                  postText={postText ?? ""}
                />
                {isNew ? (
                  <>
                    <p className="text-sm font-bold text-slate-900 mb-2">Titel</p>
                    <Input
                      {...form.register("title")}
                      placeholder="Bijv. Weekend Barcelona"
                      className="mb-4 bg-white border border-slate-200"
                    />
                    {form.formState.errors.title ? (
                      <p className="mb-4 -mt-2 text-xs font-semibold text-rose-600">
                        {form.formState.errors.title.message}
                      </p>
                    ) : null}
                    <p className="text-sm font-bold text-slate-900 mb-2">Afbeelding-URL</p>
                    <Input
                      {...form.register("imageUrl")}
                      placeholder="https://..."
                      className="mb-4 bg-white border border-slate-200"
                    />
                    <div className="rounded-2xl border border-primary/10 overflow-hidden bg-white shadow-sm mt-4">
                      <div className="relative h-32">
                        <Image
                          src={form.watch("imageUrl") || DEFAULT_IMAGE}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Facebook post inplannen
                  </p>
                  <p className="text-sm font-bold text-slate-900 mb-2">Link</p>
                  <Input
                    {...form.register("url")}
                    placeholder="https://..."
                    className="mb-4 bg-white border border-slate-200"
                  />
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Publish date
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {deal ? `Huidig: ${formatPostDateLong(deal.postDate)}` : "Kies datum en tijd voor de Facebook-post"}
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
              <Button type="submit">Inplannen</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

