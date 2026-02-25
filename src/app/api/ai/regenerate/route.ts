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

function buildUserPrompt(title: string, url: string, postText: string): string {
  return [
    "Gebruik:",
    `Titel: ${title || "(geen titel)"}`,
    `Url: ${url || "(geen url)"}`,
    `Omschrijving: ${postText || "(geen omschrijving)"}`,
    "Extra toevoeging onderaan: {{12.2}}",
  ].join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    url?: string;
    postText?: string;
  };

  const title = typeof body.title === "string" ? body.title : "";
  const url = typeof body.url === "string" ? body.url : "";
  const postText = typeof body.postText === "string" ? body.postText : "";

  const apiKey = process.env.OPENAI_API_KEY;
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
  const userPrompt = buildUserPrompt(title, url, postText);

  try {
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
    await logAiUsage(promptTokens, completionTokens, costUsd);

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const text = raw.replace(/\n{3,}/g, "\n\n").trim();

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    console.error("OpenAI regenerate error:", e);
    const message = e instanceof Error ? e.message : "OpenAI-aanroep mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
