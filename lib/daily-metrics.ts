import { prisma } from "@/lib/prisma";
import { addDays, startOfDayInTimezone } from "@/lib/date";

export interface DayMetrics {
  tasksPlanned: number;
  tasksCompleted: number;
  focusMinutes: number;
  avgTimeToStartSecs: number | null;
}

/**
 * Derives a day's objective metrics straight from tasks and sessions. The
 * check-in stores a snapshot of these so historical rows stay stable even if
 * the underlying tasks are later edited or deleted.
 */
export async function computeDayMetrics(
  userId: string,
  dayStart: Date,
): Promise<DayMetrics> {
  const dayEnd = addDays(dayStart, 1);
  const window = { gte: dayStart, lt: dayEnd };

  const [planned, completed, sessions] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        OR: [{ dueDate: window }, { scheduledFor: window }],
      },
    }),
    prisma.task.count({
      where: { userId, status: "DONE", completedAt: window },
    }),
    prisma.focusSession.findMany({
      where: {
        userId,
        actualStart: window,
        status: { in: ["COMPLETED", "ABANDONED"] },
      },
      select: {
        actualStart: true,
        completedAt: true,
        abandonedAt: true,
        timeToStartSecs: true,
      },
    }),
  ]);

  let focusMinutes = 0;
  const startDelays: number[] = [];

  for (const session of sessions) {
    const end = session.completedAt ?? session.abandonedAt;
    if (session.actualStart && end) {
      focusMinutes += Math.max(
        0,
        Math.round((end.getTime() - session.actualStart.getTime()) / 60000),
      );
    }
    if (session.timeToStartSecs !== null) {
      startDelays.push(session.timeToStartSecs);
    }
  }

  return {
    tasksPlanned: planned,
    tasksCompleted: completed,
    focusMinutes,
    avgTimeToStartSecs:
      startDelays.length > 0
        ? Math.round(
            startDelays.reduce((sum, value) => sum + value, 0) / startDelays.length,
          )
        : null,
  };
}

/**
 * Recomputes and stores today's objective metrics. Called after any mutation
 * that can move them (session finished, task completed or skipped) so the
 * DailyCheckin row is always current without waiting for the evening prompt.
 *
 * Subjective fields (energyLevel, focusQuality, note) are never touched here —
 * only the user's own reflection writes those.
 */
export async function syncDailyCheckin(
  userId: string,
  timezone: string,
  at: Date = new Date(),
): Promise<void> {
  const dayStart = startOfDayInTimezone(at, timezone);
  const metrics = await computeDayMetrics(userId, dayStart);

  await prisma.dailyCheckin.upsert({
    where: { userId_date: { userId, date: dayStart } },
    create: { userId, date: dayStart, ...metrics },
    update: metrics,
  });
}

/**
 * Fire-and-forget wrapper for request handlers: a metrics-rollup failure must
 * never turn a successful task or session mutation into an error response.
 */
export async function syncDailyCheckinSafely(
  userId: string,
  timezone: string,
  at?: Date,
): Promise<void> {
  try {
    await syncDailyCheckin(userId, timezone, at);
  } catch {
    // Swallowed deliberately: the next mutation or the check-in modal will
    // recompute the same row from source data.
  }
}
