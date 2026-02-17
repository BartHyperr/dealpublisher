import { NextResponse } from "next/server";

import type { Deal } from "@/types/deal";
import { dealsDb } from "@/lib/deals/mock-db";
import { isPostgresEnabled } from "@/lib/db/postgres";
import { pgGetDeals, pgCreateDeal } from "@/lib/db/deals-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isPostgresEnabled()) {
    const deals = await pgGetDeals();
    return NextResponse.json({ deals });
  }

  return NextResponse.json({ deals: dealsDb.getAll() });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.trim()
      ? body.imageUrl.trim()
      : "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";
  const postText = typeof body.postText === "string" ? body.postText : "";
  const category = Array.isArray(body.category)
    ? (body.category as string[]).filter((c) => typeof c === "string")
    : [];
  const promotionDays = [5, 7, 14, 21, 30].includes(Number(body.promotionDays))
    ? (Number(body.promotionDays) as Deal["promotionDays"])
    : 7;
  const publish = Boolean(body.publish);
  const postDate =
    typeof body.postDate === "string" && body.postDate.trim()
      ? body.postDate
      : undefined;
  const status =
    typeof body.status === "string" &&
    ["DRAFT", "SCHEDULED", "PUBLISHED", "ENDED"].includes(body.status)
      ? (body.status as Deal["status"])
      : postDate || publish
        ? "SCHEDULED"
        : "DRAFT";

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const payload = {
    title,
    url: url || "#",
    imageUrl,
    category: category.length ? category : ["Overig"],
    postText: postText || title,
    promotionDays,
    publish,
    postDate,
    status,
    generate: "No" as const,
  };

  if (isPostgresEnabled()) {
    try {
      const deal = await pgCreateDeal(payload);
      return NextResponse.json({ deal });
    } catch (err) {
      console.error("POST /api/deals", err);
      return NextResponse.json(
        { error: "Failed to create deal" },
        { status: 500 }
      );
    }
  }

  const deal = dealsDb.create(payload);
  return NextResponse.json({ deal });
}

