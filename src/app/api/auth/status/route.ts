import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: isAuthEnabled() });
}
