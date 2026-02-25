import { NextResponse } from "next/server";
import { getTodayAiUsage } from "@/lib/db/ai-usage-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usage = await getTodayAiUsage();
    return NextResponse.json({
      todayRequests: usage.requests,
      todayPromptTokens: usage.promptTokens,
      todayCompletionTokens: usage.completionTokens,
      todayCostUsd: usage.costUsd,
      limitUsd: usage.limitUsd,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load AI usage" },
      { status: 500 }
    );
  }
}
