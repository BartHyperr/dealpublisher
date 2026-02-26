import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getPromptSettings, DEFAULT_SYSTEM_PROMPT } from "@/lib/db/prompt-repo";
import {
  getTodayAiUsage,
  logAiUsage,
  computeAiCost,
  AI_DAILY_LIMIT_USD,
} from "@/lib/db/ai-usage-repo";

export const dynamic = "force-dynamic";

function buildUserPrompt(
  title: string,
  url: string,
  postText: string,
  promotionDays?: number
): string {
  const lines = [
    "Gebruik:",
    `Titel: ${title || "(geen titel)"}`,
    `Url: ${url || "(geen url)"}`,
    `Omschrijving: ${postText || "(geen omschrijving)"}`,
  ];
  if (promotionDays != null && [5, 7, 14, 21, 30].includes(promotionDays)) {
    lines.push(`Promotieduur: ${promotionDays} dagen (voeg #${promotionDays}dagen toe bij de hashtags)`);
  }
  lines.push("Extra toevoeging onderaan: {{12.2}}");
  return lines.join("\n");
}

export async function POST(req: Request) {
  console.log("[AI regenerate] POST /api/ai/regenerate called");
  try {
    const body = (await req.json().catch((err) => {
      console.warn("[AI regenerate] body parse failed", err);
      return {};
    })) as {
      title?: string;
      url?: string;
      postText?: string;
      promotionDays?: number;
    };

    const title = typeof body.title === "string" ? body.title : "";
    const url = typeof body.url === "string" ? body.url : "";
    const postText = typeof body.postText === "string" ? body.postText : "";
    const promotionDays = [5, 7, 14, 21, 30].includes(Number(body.promotionDays))
      ? Number(body.promotionDays)
      : undefined;

    let apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
    if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'")))
      apiKey = apiKey.slice(1, -1).trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is niet geconfigureerd" },
        { status: 500 }
      );
    }

    const today = await getTodayAiUsage();
    if (today.costUsd >= AI_DAILY_LIMIT_USD) {
      return NextResponse.json(
        {
          error: `Daglimiet van $${AI_DAILY_LIMIT_USD} bereikt. Verbruik vandaag: $${today.costUsd.toFixed(2)}. Morgen weer beschikbaar.`,
        },
        { status: 429 }
      );
    }

    const { systemPrompt: storedPrompt } = await getPromptSettings();
    const systemPrompt = (storedPrompt && storedPrompt.trim()) ? storedPrompt.trim() : DEFAULT_SYSTEM_PROMPT;

    const openai = new OpenAI({ apiKey });
    const userPrompt = buildUserPrompt(title, url, postText, promotionDays);
    console.log("[AI regenerate] Calling OpenAI (gpt-4o-mini)...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const costUsd = computeAiCost(promptTokens, completionTokens);
    await logAiUsage(promptTokens, completionTokens, costUsd).catch((err) =>
      console.warn("logAiUsage failed:", err)
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const text = raw.replace(/\n{3,}/g, "\n\n").trim();
    console.log("[AI regenerate] Success, text length:", text.length);

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    console.error("OpenAI regenerate error:", e);
    let message = "OpenAI-aanroep mislukt";
    if (e instanceof Error) message = e.message;
    const err = e as { error?: { message?: string }; status?: number };
    if (err?.error?.message) message = err.error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
