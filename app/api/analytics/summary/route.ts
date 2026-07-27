import { ok, unauthorized } from "@/lib/api";
import { addDays, dayKey, startOfDayInTimezone } from "@/lib/date";
import { computeDayMetrics } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STREAK_LOOKBACK_DAYS = 120;

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const today = startOfDayInTimezone(new Date(), user.timezone);
  const weekStart = addDays(today, -6);
  const streakStart = addDays(today, -STREAK_LOOKBACK_DAYS);

  const [storedToday, weekTasks, streakSessions] = await Promise.all([
    prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
      select: {
        tasksPlanned: true,
        tasksCompleted: true,
        focusMinutes: true,
        avgTimeToStartSecs: true,
        energyLevel: true,
        focusQuality: true,
      },
    }),
    prisma.task.findMany({
      where: {
        userId: user.id,
        status: "DONE",
        completedAt: { gte: weekStart, lt: addDays(today, 1) },
      },
      select: { completedAt: true },
    }),
    prisma.focusSession.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
        actualStart: { gte: streakStart },
      },
      select: { actualStart: true },
    }),
  ]);

  // The DailyCheckin row is kept current by every task/session mutation. It is
  // the source of truth here; a live recompute only covers the gap before the
  // day's first mutation has written a row.
  const metrics = storedToday ?? (await computeDayMetrics(user.id, today));

  const weekly = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    return { date: dayKey(day), completed: 0, isToday: dayKey(day) === dayKey(today) };
  });
  const weeklyIndex = new Map(weekly.map((row, index) => [row.date, index]));

  for (const task of weekTasks) {
    if (!task.completedAt) continue;
    const key = dayKey(startOfDayInTimezone(task.completedAt, user.timezone));
    const index = weeklyIndex.get(key);
    if (index !== undefined) weekly[index].completed += 1;
  }

  const sessionDays = new Set(
    streakSessions
      .filter((session) => session.actualStart)
      .map((session) =>
        dayKey(startOfDayInTimezone(session.actualStart!, user.timezone)),
      ),
  );

  // A streak survives today being empty until the day is over — otherwise it
  // would read zero every morning.
  let streak = 0;
  let cursor = sessionDays.has(dayKey(today)) ? today : addDays(today, -1);
  while (sessionDays.has(dayKey(cursor)) && streak < STREAK_LOOKBACK_DAYS) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return ok({
    date: dayKey(today),
    tasksPlanned: metrics.tasksPlanned,
    tasksCompleted: metrics.tasksCompleted,
    focusMinutes: metrics.focusMinutes,
    avgTimeToStartSecs: metrics.avgTimeToStartSecs,
    energyLevel: storedToday?.energyLevel ?? null,
    focusQuality: storedToday?.focusQuality ?? null,
    fromCheckin: Boolean(storedToday),
    streak,
    weekly,
  });
}
