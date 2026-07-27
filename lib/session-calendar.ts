import type { FocusSession, Task } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  LEVER_PREFIX,
  createEvent,
  deleteEvent,
  getCalendarStatus,
  safeCalendar,
  updateEvent,
} from "@/lib/google-calendar";

type SessionWithTask = FocusSession & { task?: Pick<Task, "title"> | null };

/** "[LEVER] Menulis bab 3" or "[LEVER] Sesi Fokus" when no task is attached. */
export function sessionEventTitle(session: SessionWithTask): string {
  return session.task?.title
    ? `${LEVER_PREFIX} ${session.task.title}`
    : `${LEVER_PREFIX} Sesi Fokus`;
}

function sessionDescription(
  session: SessionWithTask,
  state: "planned" | "completed" | "abandoned",
): string {
  const lines: string[] = [];

  if (state === "abandoned") {
    lines.push("Sesi ditinggalkan sebelum durasi penuh selesai.");
  } else if (state === "completed") {
    lines.push("Sesi fokus selesai.");
  } else {
    lines.push(`Sesi fokus ${session.durationMins} menit.`);
  }

  if (session.intentionText) {
    lines.push("", session.intentionText);
  }
  if (session.timeToStartSecs !== null) {
    lines.push("", `Time-to-start: ${session.timeToStartSecs} detik.`);
  }

  lines.push("", "Dibuat otomatis oleh LEVER.");
  return lines.join("\n");
}

/** End of the block as planned, from whichever start we have. */
function plannedEnd(session: SessionWithTask): Date {
  const start = session.actualStart ?? session.plannedStart;
  return new Date(start.getTime() + session.durationMins * 60_000);
}

/**
 * Creates the calendar event for a session, if the user has sync on and a
 * target calendar chosen. Returns the stored event id, or null when nothing
 * was written. Never throws.
 */
export async function pushSessionToCalendar(
  userId: string,
  sessionId: string,
): Promise<string | null> {
  const status = await getCalendarStatus(userId);
  if (!status.connected || !status.syncSessions || !status.calendarId) return null;

  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId },
    include: { task: { select: { title: true } } },
  });
  if (!session || session.calendarEventId) return session?.calendarEventId ?? null;

  const start = session.actualStart ?? session.plannedStart;

  const result = await safeCalendar(() =>
    createEvent(userId, {
      summary: sessionEventTitle(session),
      description: sessionDescription(session, "planned"),
      start,
      end: plannedEnd(session),
    }),
  );

  if (!result.data) return null;

  await prisma.focusSession
    .update({
      where: { id: sessionId },
      data: { calendarEventId: result.data },
    })
    .catch(() => undefined);

  return result.data;
}

/**
 * Rewrites the event to reflect what actually happened: the real end time, and
 * for abandoned sessions a description that says so.
 */
export async function closeSessionOnCalendar(
  userId: string,
  sessionId: string,
  outcome: "completed" | "abandoned",
  endedAt: Date,
): Promise<void> {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId },
    include: { task: { select: { title: true } } },
  });
  if (!session?.calendarEventId) return;

  const status = await getCalendarStatus(userId);
  if (!status.connected || !status.calendarId) return;

  const start = session.actualStart ?? session.plannedStart;
  // Google rejects a zero-length event; keep at least one minute.
  const end = endedAt > start ? endedAt : new Date(start.getTime() + 60_000);

  await safeCalendar(() =>
    updateEvent(userId, session.calendarEventId!, {
      summary:
        outcome === "abandoned"
          ? `${sessionEventTitle(session)} (ditinggalkan)`
          : sessionEventTitle(session),
      description: sessionDescription(session, outcome),
      start,
      end,
    }),
  );
}

/** Removes a session's event, used when a session row is discarded. */
export async function removeSessionFromCalendar(
  userId: string,
  eventId: string,
): Promise<void> {
  await safeCalendar(() => deleteEvent(userId, eventId));
}
