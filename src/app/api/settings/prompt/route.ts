import { NextResponse } from "next/server";
import { getPromptSettings, savePromptSettings } from "@/lib/db/prompt-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPromptSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load prompt settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { systemPrompt?: string };
    const settings = await savePromptSettings({
      systemPrompt: typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
    });
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save prompt settings" },
      { status: 500 }
    );
  }
}
