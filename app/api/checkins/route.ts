import { ok, parseBody, parseQuery, unauthorized } from "@/lib/api";
import { addDays, startOfDayInTimezone } from "@/lib/date";
import { computeDayMetrics } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import {
  listCheckinsSchema,
  upsertCheckinSchema,
} from "@/lib/validations/checkin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const query = parseQuery(request, listCheckinsSchema);
  if (!query.success) return query.response;

  const { from, to, limit } = query.data;

  const checkins = await prisma.dailyCheckin.findMany({
    where: {
      userId: user.id,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
              ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
    take: limit ?? 30,
  });

  const today = startOfDayInTimezone(new Date(), user.timezone);
  const todayMetrics = await computeDayMetrics(user.id, today);

  // Unfinished work the user has to resolve in the check-in.
  const unfinished = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: { in: ["TODO", "IN_PROGRESS"] },
      OR: [
        { dueDate: { gte: today, lt: addDays(today, 1) } },
        { scheduledFor: { gte: today, lt: addDays(today, 1) } },
      ],
    },
    select: { id: true, title: true, status: true, priority: true },
    orderBy: { sortOrder: "asc" },
  });

  return ok({
    checkins: checkins.map((row) => ({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      tasksPlanned: row.tasksPlanned,
      tasksCompleted: row.tasksCompleted,
      focusMinutes: row.focusMinutes,
      avgTimeToStartSecs: row.avgTimeToStartSecs,
      energyLevel: row.energyLevel,
      focusQuality: row.focusQuality,
      note: row.note,
    })),
    today: {
      date: today.toISOString().slice(0, 10),
      ...todayMetrics,
      unfinished,
      submitted: checkins.some(
        (row) => row.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
      ),
    },
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const parsed = await parseBody(request, upsertCheckinSchema);
  if (!parsed.success) return parsed.response;

  const dayStart = parsed.data.date
    ? new Date(`${parsed.data.date}T00:00:00.000Z`)
    : startOfDayInTimezone(new Date(), user.timezone);

  // Objective numbers are always recomputed; only the subjective fields come
  // from the request body.
  const metrics = await computeDayMetrics(user.id, dayStart);

  const checkin = await prisma.dailyCheckin.upsert({
    where: { userId_date: { userId: user.id, date: dayStart } },
    create: {
      userId: user.id,
      date: dayStart,
      ...metrics,
      energyLevel: parsed.data.energyLevel ?? null,
      focusQuality: parsed.data.focusQuality ?? null,
      note: parsed.data.note ?? null,
    },
    update: {
      ...metrics,
      ...(parsed.data.energyLevel === undefined
        ? {}
        : { energyLevel: parsed.data.energyLevel }),
      ...(parsed.data.focusQuality === undefined
        ? {}
        : { focusQuality: parsed.data.focusQuality }),
      ...(parsed.data.note === undefined ? {} : { note: parsed.data.note }),
    },
  });

  return ok({
    checkin: {
      id: checkin.id,
      date: checkin.date.toISOString().slice(0, 10),
      tasksPlanned: checkin.tasksPlanned,
      tasksCompleted: checkin.tasksCompleted,
      focusMinutes: checkin.focusMinutes,
      avgTimeToStartSecs: checkin.avgTimeToStartSecs,
      energyLevel: checkin.energyLevel,
      focusQuality: checkin.focusQuality,
      note: checkin.note,
    },
  });
}
