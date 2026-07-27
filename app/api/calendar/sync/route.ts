import { fail, ok, unauthorized } from "@/lib/api";
import { addDays, startOfDayInTimezone } from "@/lib/date";
import { getCalendarStatus } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { pushSessionToCalendar } from "@/lib/session-calendar";

export const runtime = "nodejs";

/** Sessions from the last 7 days forward are worth backfilling. */
const BACKFILL_DAYS = 7;

export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const status = await getCalendarStatus(user.id);

  if (!status.connected) {
    return fail(
      "Google Calendar belum dihubungkan. Hubungkan akun Google terlebih dahulu.",
      "NOT_CONNECTED",
      409,
    );
  }
  if (status.needsReconnect) {
    return fail(
      "Kalender perlu dihubungkan ulang sebelum sinkronisasi bisa berjalan.",
      "RECONNECT_REQUIRED",
      401,
    );
  }
  if (!status.calendarId) {
    return fail(
      "Belum ada kalender tujuan. Pilih kalender di Pengaturan > Kalender.",
      "NO_CALENDAR_SELECTED",
      409,
    );
  }
  if (!status.syncSessions) {
    return fail(
      "Sinkronisasi sesi ke kalender sedang dimatikan. Aktifkan toggle-nya dulu.",
      "SYNC_DISABLED",
      409,
    );
  }

  const dayStart = startOfDayInTimezone(new Date(), user.timezone);

  const pending = await prisma.focusSession.findMany({
    where: {
      userId: user.id,
      calendarEventId: null,
      plannedStart: { gte: addDays(dayStart, -BACKFILL_DAYS) },
    },
    select: { id: true },
    orderBy: { plannedStart: "asc" },
    take: 50,
  });

  let created = 0;
  const failures: string[] = [];

  for (const session of pending) {
    const eventId = await pushSessionToCalendar(user.id, session.id);
    if (eventId) created += 1;
    else failures.push(session.id);
  }

  const syncedAt = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { calendarLastSyncedAt: syncedAt },
  });

  return ok({
    considered: pending.length,
    created,
    failed: failures.length,
    lastSyncedAt: syncedAt.toISOString(),
  });
}
