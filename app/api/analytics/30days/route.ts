import { ok, unauthorized } from "@/lib/api";
import {
  ADHERENCE_GRACE_SECS,
  LATE_START_SECS,
  SKIP_REASON_LABELS,
  bucketScores,
  emptySeries,
  localDayKey,
  localHour,
  type HourPoint,
  type SkipReasonPoint,
} from "@/lib/analytics";
import { addDays, startOfDayInTimezone } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const todayStart = startOfDayInTimezone(new Date(), user.timezone);
  const windowStart = addDays(todayStart, -(WINDOW_DAYS - 1));
  const windowEnd = addDays(todayStart, 1);

  const [tasksDue, tasksClosed, sessions, scoredTasks, unscoredCount] =
    await Promise.all([
      // Denominator for completion rate: what the day was supposed to hold.
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { dueDate: { gte: windowStart, lt: windowEnd } },
            { scheduledFor: { gte: windowStart, lt: windowEnd } },
          ],
        },
        select: { dueDate: true, scheduledFor: true },
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { completedAt: { gte: windowStart, lt: windowEnd } },
            { skippedAt: { gte: windowStart, lt: windowEnd } },
          ],
        },
        select: {
          status: true,
          completedAt: true,
          skippedAt: true,
          skippedReason: true,
        },
      }),
      prisma.focusSession.findMany({
        where: {
          userId: user.id,
          actualStart: { gte: windowStart, lt: windowEnd },
        },
        select: {
          actualStart: true,
          completedAt: true,
          abandonedAt: true,
          timeToStartSecs: true,
        },
      }),
      prisma.task.findMany({
        where: { userId: user.id, motivationScore: { not: null } },
        select: { motivationScore: true },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          motivationScore: null,
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
      }),
    ]);

  const { points, index } = emptySeries(todayStart, WINDOW_DAYS);

  const hours: HourPoint[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    procrastination: 0,
    skips: 0,
    lateStarts: 0,
    completed: 0,
  }));

  const skipCounts = new Map<string, number>();
  const delaysByDay = new Map<string, number[]>();

  for (const task of tasksDue) {
    const anchor = task.dueDate ?? task.scheduledFor;
    if (!anchor) continue;
    const position = index.get(localDayKey(anchor, user.timezone));
    if (position !== undefined) points[position].tasksPlanned += 1;
  }

  for (const task of tasksClosed) {
    if (task.status === "DONE" && task.completedAt) {
      const position = index.get(localDayKey(task.completedAt, user.timezone));
      if (position !== undefined) points[position].tasksCompleted += 1;
      hours[localHour(task.completedAt, user.timezone)].completed += 1;
    }

    if (task.status === "SKIPPED" && task.skippedAt) {
      hours[localHour(task.skippedAt, user.timezone)].skips += 1;
      // Reasons are stored as `CODE` or `CODE: free text`.
      const code = (task.skippedReason ?? "OTHER").split(":")[0].trim();
      skipCounts.set(code, (skipCounts.get(code) ?? 0) + 1);
    }
  }

  for (const session of sessions) {
    if (!session.actualStart) continue;

    const key = localDayKey(session.actualStart, user.timezone);
    const position = index.get(key);
    if (position === undefined) continue;

    const point = points[position];
    point.sessionsStarted += 1;

    const end = session.completedAt ?? session.abandonedAt;
    if (end) {
      point.focusMinutes += Math.max(
        0,
        Math.round((end.getTime() - session.actualStart.getTime()) / 60000),
      );
    }

    if (session.timeToStartSecs !== null) {
      const bucket = delaysByDay.get(key) ?? [];
      bucket.push(session.timeToStartSecs);
      delaysByDay.set(key, bucket);

      if (session.timeToStartSecs <= ADHERENCE_GRACE_SECS) {
        point.sessionsOnTime += 1;
      }
      if (session.timeToStartSecs > LATE_START_SECS) {
        hours[localHour(session.actualStart, user.timezone)].lateStarts += 1;
      }
    }
  }

  for (const point of points) {
    if (point.tasksPlanned > 0) {
      point.completionRate = Math.round(
        (point.tasksCompleted / point.tasksPlanned) * 100,
      );
    }
    if (point.sessionsStarted > 0) {
      point.scheduleAdherence = Math.round(
        (point.sessionsOnTime / point.sessionsStarted) * 100,
      );
    }
    const delays = delaysByDay.get(point.date);
    if (delays && delays.length > 0) {
      point.avgTimeToStartSecs = Math.round(
        delays.reduce((sum, value) => sum + value, 0) / delays.length,
      );
    }
  }

  for (const hour of hours) {
    hour.procrastination = hour.skips + hour.lateStarts;
  }

  const skipReasons: SkipReasonPoint[] = Object.keys(SKIP_REASON_LABELS)
    .map((code) => ({
      code,
      label: SKIP_REASON_LABELS[code],
      count: skipCounts.get(code) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const scores = scoredTasks
    .map((task) => task.motivationScore)
    .filter((score): score is number => score !== null);

  return ok({
    windowDays: WINDOW_DAYS,
    from: points[0]?.date ?? null,
    to: points[points.length - 1]?.date ?? null,
    days: points,
    hours,
    skipReasons,
    scoreDistribution: bucketScores(scores),
    scoredTaskCount: scores.length,
    unscoredTaskCount: unscoredCount,
  });
}
