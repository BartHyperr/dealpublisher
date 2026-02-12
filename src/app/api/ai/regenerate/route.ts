import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generateMockPostText(input: {
  title?: string;
  url?: string;
  categories?: string[];
}) {
  const cats = input.categories?.length ? ` (${input.categories.join(" · ")})` : "";
  const title = input.title ?? "Nieuwe deal";
  const url = input.url ?? "";
  return [
    `✨ ${title}${cats}`,
    "",
    "📌 Tip: plan ‘m alvast in je kalender en pak je voordeel zolang het kan.",
    url ? `🔗 ${url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    url?: string;
    categories?: string[];
  };

  // Simuleer een korte AI-latency
  await new Promise((r) => setTimeout(r, 450));

  return NextResponse.json({
    ok: true,
    text: generateMockPostText(body),
  });
}

