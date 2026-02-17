import { NextResponse } from "next/server";
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "@/lib/db/notifications-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getNotificationSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const notifyOnEnded = Boolean(body.notifyOnEnded);
  const notifyDaysBefore =
    typeof body.notifyDaysBefore === "number" && [1, 2, 3, 5, 7].includes(body.notifyDaysBefore)
      ? body.notifyDaysBefore
      : body.notifyOnEndingSoon
        ? 2
        : null;
  const weeklyDigest = Boolean(body.weeklyDigest);

  try {
    const settings = await saveNotificationSettings({
      email,
      notifyOnEnded,
      notifyDaysBefore,
      weeklyDigest,
    });
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}
