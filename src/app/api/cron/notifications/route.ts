import { NextResponse } from "next/server";
import { parseISO, differenceInCalendarDays, startOfDay, subDays, addDays } from "date-fns";

import { getDealsForNotification } from "@/lib/deals/get-deals";
import {
  getNotificationSettings,
  getDealIdsAlreadyNotifiedEnded,
  getDealIdsAlreadyNotifiedEndingSoon,
  logNotificationSent,
  wasWeeklyDigestSentInLastDays,
  logWeeklyDigestSent,
} from "@/lib/db/notifications-repo";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function ensureAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret = allow (dev)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function GET(req: Request) {
  if (!ensureAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getNotificationSettings();
  if (!settings.email?.trim()) {
    return NextResponse.json({
      ok: true,
      message: "Geen e-mailadres geconfigureerd; geen notificaties verzonden.",
    });
  }

  const deals = await getDealsForNotification();
  const results: { ended: number; endingSoon: number; weeklyDigest: boolean } = {
    ended: 0,
    endingSoon: 0,
    weeklyDigest: false,
  };

  // 1) E-mail bij afgelopen deal: status ENDED, nog niet gemeld
  const notifiedEnded = await getDealIdsAlreadyNotifiedEnded(30);
  if (settings.notifyOnEnded) {
    const endedDeals = deals.filter((d) => d.status === "ENDED" && !notifiedEnded.has(d.id));
    if (endedDeals.length > 0) {
      const html = `
        <h2>Deals afgelopen</h2>
        <p>De volgende deal(s) zijn beëindigd:</p>
        <ul>
          ${endedDeals.map((d) => `<li><strong>${escapeHtml(d.title)}</strong> (einddatum: ${formatDate(d.promotionEndDate)})</li>`).join("")}
        </ul>
        <p>Met vriendelijke groet,<br/>Hyperr Poster</p>
      `;
      const { ok } = await sendEmail({
        to: settings.email,
        subject: `Hyperr Poster: ${endedDeals.length} deal(s) afgelopen`,
        html,
        text: `Deals afgelopen: ${endedDeals.map((d) => d.title).join(", ")}`,
      });
      if (ok) {
        for (const d of endedDeals) await logNotificationSent(d.id, "ended");
        results.ended = endedDeals.length;
      }
    }
  }

  // 2) E-mail wanneer deal bijna afloopt
  const daysBefore = settings.notifyDaysBefore ?? 0;
  if (daysBefore > 0) {
    const notifiedEndingSoon = await getDealIdsAlreadyNotifiedEndingSoon(7);
    const today = startOfDay(new Date());
    const endingSoon = deals.filter((d) => {
      if (d.status !== "SCHEDULED" && d.status !== "PUBLISHED") return false;
      if (!d.promotionEndDate) return false;
      if (notifiedEndingSoon.has(d.id)) return false;
      const end = parseISO(d.promotionEndDate);
      const daysLeft = differenceInCalendarDays(end, today);
      return daysLeft >= 0 && daysLeft <= daysBefore;
    });
    if (endingSoon.length > 0) {
      const html = `
        <h2>Deals lopen bijna af</h2>
        <p>De volgende deal(s) lopen binnen ${daysBefore} dag(en) af:</p>
        <ul>
          ${endingSoon.map((d) => `<li><strong>${escapeHtml(d.title)}</strong> — einddatum: ${formatDate(d.promotionEndDate)}</li>`).join("")}
        </ul>
        <p>Met vriendelijke groet,<br/>Hyperr Poster</p>
      `;
      const { ok } = await sendEmail({
        to: settings.email,
        subject: `Hyperr Poster: ${endingSoon.length} deal(s) lopen bijna af`,
        html,
        text: `Bijna afgelopen: ${endingSoon.map((d) => d.title).join(", ")}`,
      });
      if (ok) {
        for (const d of endingSoon) await logNotificationSent(d.id, "ending_soon");
        results.endingSoon = endingSoon.length;
      }
    }
  }

  // 3) Wekelijkse update
  if (settings.weeklyDigest && !(await wasWeeklyDigestSentInLastDays(8))) {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const weekAhead = addDays(now, 7);

    const active = deals.filter((d) => d.status === "SCHEDULED" || d.status === "PUBLISHED");
    const endedLastWeek = deals.filter((d) => {
      if (d.status !== "ENDED") return false;
      const end = d.promotionEndDate ? parseISO(d.promotionEndDate) : null;
      return end && end >= weekAgo && end <= now;
    });
    const scheduledNextWeek = deals.filter((d) => {
      if (!d.postDate) return false;
      const post = parseISO(d.postDate);
      return post >= now && post <= weekAhead;
    });

    const html = `
      <h2>Wekelijkse update — Hyperr Poster</h2>
      <p><strong>Aantal actieve campagnes:</strong> ${active.length}</p>
      <p><strong>Afgelopen week afgelopen:</strong> ${endedLastWeek.length}</p>
      ${endedLastWeek.length > 0 ? `<ul>${endedLastWeek.map((d) => `<li>${escapeHtml(d.title)}</li>`).join("")}</ul>` : ""}
      <p><strong>Volgende week ingepland:</strong> ${scheduledNextWeek.length}</p>
      ${scheduledNextWeek.length > 0 ? `<ul>${scheduledNextWeek.map((d) => `<li>${escapeHtml(d.title)} — ${formatDate(d.postDate)}</li>`).join("")}</ul>` : ""}
      <p>Met vriendelijke groet,<br/>Hyperr Poster</p>
    `;
    const { ok } = await sendEmail({
      to: settings.email,
      subject: "Hyperr Poster: wekelijkse update",
      html,
      text: `Actief: ${active.length}. Afgelopen week: ${endedLastWeek.length}. Volgende week ingepland: ${scheduledNextWeek.length}.`,
    });
    if (ok) {
      await logWeeklyDigestSent();
      results.weeklyDigest = true;
    }
  }

  return NextResponse.json({
    ok: true,
    emailConfigured: isEmailConfigured(),
    ...results,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
