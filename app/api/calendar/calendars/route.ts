import { fail, ok, unauthorized } from "@/lib/api";
import { CalendarError, getCalendarStatus, getCalendars } from "@/lib/google-calendar";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const status = await getCalendarStatus(userId);
  if (!status.connected) {
    return ok({ calendars: [], status });
  }

  try {
    const calendars = await getCalendars(userId);
    return ok({ calendars, status });
  } catch (error) {
    if (error instanceof CalendarError) {
      // Re-read the status so a fresh invalid_grant is reflected immediately.
      return fail(error.message, error.code, error.status, undefined);
    }
    return fail(
      "Daftar kalender gagal diambil dari Google.",
      "API_ERROR",
      502,
    );
  }
}
