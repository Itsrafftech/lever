import { ok, unauthorized } from "@/lib/api";
import {
  getCalendarStatus,
  getUpcomingEvents,
  safeCalendar,
} from "@/lib/google-calendar";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_DAYS = 7;

export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("days") ?? DEFAULT_DAYS);
  const days = Number.isFinite(requested)
    ? Math.min(30, Math.max(1, Math.trunc(requested)))
    : DEFAULT_DAYS;

  const status = await getCalendarStatus(userId);

  if (!status.connected || !status.importEvents || !status.calendarId) {
    return ok({ events: [], status, skipped: true });
  }

  // The timeline calls this on every dashboard load, so a Google problem must
  // degrade to "no events" rather than breaking the page.
  const result = await safeCalendar(() => getUpcomingEvents(userId, days));

  return ok({
    events: result.data ?? [],
    status: {
      ...status,
      needsReconnect:
        status.needsReconnect || result.error?.code === "RECONNECT_REQUIRED",
    },
    error: result.error,
    skipped: false,
  });
}
